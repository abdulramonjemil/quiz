import { mrh, rh, Component } from "@/jsx"
import { attemptElementFocus, cn } from "@/lib/dom"
import { uniqueId } from "@/lib/factory"
import { assertIsDefined, assertIsInstance, bindReturn } from "@/lib/value"
import { Tabs, type TabChangeHandler } from "@/ui/tabs"

// Import before components to allow overrides
import "@/scss/quiz.module.scss"

import Header from "@/components/header"
import Progress from "@/components/progress"
import Presentation from "@/components/presentation"
import Result from "@/components/result"
import ControlPanel from "@/components/control-panel"

import { finalizeQuiz, getQuizFinalizationData } from "./finalization"
import { createQuizShortcutHandlersCreator, setupQuizTabs } from "./behaviour"
import { revalidateQuiz } from "./revalidation"
import { getStorageKey, storeQuizData } from "./storage"

import {
  quizClasses,
  tabNameToQuizElementIndex,
  type QuizProps,
  type QuizSlideElement,
  type QuizElementInstance
} from "./base"

import { getQuizDataForSlide } from "./data"
import {
  assertValidQuizPropsElementConfig,
  buildQuizSlideElements,
  getAvailableFinalizedElements
} from "./element"

function applyDefaultConfigs(props: QuizProps) {
  return {
    ...props,
    rootElementType: props.rootElementType ?? "div",
    customRootClass: props.customRootClass ?? null,
    answerSelectionMode: props.answerSelectionMode ?? "sequential"
  }
}

// NOTE: Pick<QuizProps, keyof QuizProps> is used instead of `QuizProps`
// directly because TS complains about `QuizProps` not having an index
// signature. See https://github.com/microsoft/TypeScript/issues/15300
// for more on the issue.
type RQuizProps = Pick<QuizProps, keyof QuizProps>

export class Quiz<
  Props extends RQuizProps = RQuizProps
> extends Component<Props> {
  protected _metadata
  protected _elementInstances

  protected _tabs
  protected _progress
  protected _presentation
  protected _controlPanel

  static create({
    props,
    container
  }: {
    props: QuizProps
    container?: Element | undefined
  }) {
    const containerIsElementInstance = container instanceof Element
    const instanceRefHolder = rh<Quiz>(null)
    const quizElement = (
      <Quiz {...props} instanceRefHolder={instanceRefHolder} />
    )
    if (containerIsElementInstance) container.replaceChildren(quizElement)
    return [quizElement, instanceRefHolder.ref] as const
  }

  constructor(props: Props) {
    const {
      autosave,
      elements,
      answerSelectionMode,
      finalized,
      header,
      headerLevel,
      customRootClass,
      rootElementType: RootElementType,
      codeBoardTheme,
      animateResultIndicator,
      getResultSummaryText
    } = applyDefaultConfigs(props)

    assertValidQuizPropsElementConfig(elements)
    const fullElements = [...elements, { type: "RESULT" }] as QuizSlideElement[]
    const quizRH = mrh<Quiz>(null)
    const instanceRH = mrh<QuizElementInstance[]>(null)

    const proxiedGetSummaryText = () => {
      const data = getAvailableFinalizedElements({
        elements,
        elementInstances: instanceRH.ref,
        autoSaveConfig: autosave,
        previouslyFinalized: finalized
      })

      const desc = "available finalized element when getting result summary"
      assertIsDefined(data, desc)
      assertIsDefined(getResultSummaryText, "getSummaryText in proxied version")
      return getResultSummaryText(getQuizFinalizationData(data))
    }

    const { elementNodes, elementInstances } = buildQuizSlideElements({
      elements: fullElements,
      codeBoardTheme,
      animateResultIndicator,
      getResultSummaryText: getResultSummaryText ? proxiedGetSummaryText : null,
      handleQuestionOptionChange: bindReturn(
        // eslint-disable-next-line @typescript-eslint/unbound-method
        Quiz.prototype._handleQuestionOptionChange,
        () => [quizRH.ref]
      ),
      handleResultCTAButtonClick: bindReturn(
        // eslint-disable-next-line @typescript-eslint/unbound-method
        Quiz.prototype._handleResultCTAButtonClick,
        () => [quizRH.ref]
      )
    })
    instanceRH.ref = elementInstances

    const finalizedElements = getAvailableFinalizedElements({
      elements,
      elementInstances,
      autoSaveConfig: autosave,
      previouslyFinalized: finalized
    })

    if (finalizedElements) {
      finalizeQuiz(finalizedElements, elementInstances)
    }

    const resultIndex = elementInstances.length - 1
    const resultInstance = elementInstances[resultIndex]
    assertIsInstance(resultInstance, Result)

    const quizLabellingId = uniqueId()
    const presentationControllingId = uniqueId()

    const progressRH = rh<Progress>(null)
    const presentationRH = rh<Presentation>(null)
    const cPanelRH = rh<ControlPanel>(null)
    let tabs = null as Tabs | null

    const createQuizShortcutHandlers = createQuizShortcutHandlersCreator()
    const shortcutHandlers = createQuizShortcutHandlers(() => {
      assertIsInstance(tabs, Tabs)
      return {
        elementInstances,
        controlPanel: cPanelRH.ref,
        presentation: presentationRH.ref,
        progress: progressRH.ref,
        answerSelectionMode,
        tabs
      }
    })

    const quizNode = (
      // @ts-expect-error -- TS takes `RootElementType` as Component even though
      // it is of string type
      <RootElementType className={cn(customRootClass, quizClasses.root)}>
        <div
          aria-labelledby={quizLabellingId}
          tabIndex={-1}
          onKeyDownCapture={shortcutHandlers.keydown}
          onKeyUpCapture={shortcutHandlers.keyup}
          className={quizClasses.inner}
        >
          {header && (
            <Header labellingId={quizLabellingId} level={headerLevel}>
              {header}
            </Header>
          )}
          <Progress
            levelsCount={elementInstances.length}
            lastAsCompletionLevel
            instanceRefHolder={progressRH}
          />
          <Presentation
            id={presentationControllingId}
            instanceRefHolder={presentationRH}
            slides={elementNodes}
          />
          <ControlPanel
            controlledElementId={presentationControllingId}
            getAlternateFocusable={() => {
              assertIsInstance(tabs, Tabs)
              return tabs.activeTab().content
            }}
            handlePrevButtonClick={bindReturn(
              // eslint-disable-next-line @typescript-eslint/unbound-method
              Quiz.prototype._handleCPanelBtnClick,
              () => [quizRH.ref, "prev" as const]
            )}
            handleNextButtonClick={bindReturn(
              // eslint-disable-next-line @typescript-eslint/unbound-method
              Quiz.prototype._handleCPanelBtnClick,
              () => [quizRH.ref, "next" as const]
            )}
            handleCTAButtonClick={() => {
              const shouldJumpToResult = resultInstance.isFinalized()
              if (shouldJumpToResult) this._handleCPanelResultJumpCTAClick()
              else this._handleCPanelSubmitCTAClick()
            }}
            instanceRefHolder={cPanelRH}
          />
        </div>
      </RootElementType>
    )

    const appropriateIndex = resultInstance.isFinalized() ? resultIndex : 0

    tabs = setupQuizTabs({
      tablistLabel: header ?? null,
      elements: fullElements,
      progress: progressRH.ref,
      presentation: presentationRH.ref,
      defaultTabIndex: appropriateIndex,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      tabChangeHandler: bindReturn(Quiz.prototype._handleTabChange, () => [
        quizRH.ref
      ])
    })

    revalidateQuiz({
      slideIndex: appropriateIndex,
      elementInstances,
      progress: progressRH.ref,
      controlPanel: cPanelRH.ref,
      presentation: presentationRH.ref,
      tabs,
      answerSelectionMode
    })

    super(props, quizNode)

    quizRH.ref = this

    type AutosaveMetadata =
      | { enabled: false; storageKey: null }
      | { enabled: true; storageKey: string }

    const autosaveMetadata = {
      enabled: Boolean(autosave),
      storageKey: autosave ? getStorageKey(autosave) : null
    } as AutosaveMetadata

    this._metadata = {
      autosave: autosaveMetadata,
      answerSelectionMode
    }
    this._elementInstances = elementInstances

    this._tabs = tabs
    this._progress = progressRH.ref
    this._presentation = presentationRH.ref
    this._controlPanel = cPanelRH.ref
  }

  _handleCPanelBtnClick(button: "prev" | "next") {
    const { _elementInstances, _presentation, _metadata } = this
    const { allowedPrevIndex, allowedNextIndex } = getQuizDataForSlide(
      _elementInstances,
      _presentation.currentSlideIndex(),
      _metadata.answerSelectionMode
    ).slide

    const appropriateIndex =
      button === "prev" ? allowedPrevIndex : allowedNextIndex
    if (typeof appropriateIndex !== "number") return
    this._revalidate(appropriateIndex)
  }

  _handleCPanelSubmitCTAClick() {
    const availableFinalizedElements = getAvailableFinalizedElements({
      elements: this._props.elements,
      elementInstances: this._elementInstances,
      previouslyFinalized: this._props.finalized,
      autoSaveConfig: this._props.autosave
    })

    const desc = "available finalized element when clicking submit"
    assertIsDefined(availableFinalizedElements, desc)

    finalizeQuiz(availableFinalizedElements, this._elementInstances)
    this._revalidate(this._elementInstances.length - 1)

    const autosaveMetadata = this._metadata.autosave
    if (autosaveMetadata.enabled) {
      storeQuizData(availableFinalizedElements, autosaveMetadata.storageKey)
    }

    if (typeof this._props.onSubmit === "function") {
      const data = getQuizFinalizationData(availableFinalizedElements)
      this._props.onSubmit.call(null, data)
    }
  }

  _handleCPanelResultJumpCTAClick() {
    const { _elementInstances } = this
    const resultIndexIfPresent = _elementInstances.length - 1
    this._revalidate(resultIndexIfPresent)
  }

  _handleQuestionOptionChange() {
    const currentSlideIndex = this._presentation.currentSlideIndex()
    this._revalidate(currentSlideIndex)
  }

  _handleResultCTAButtonClick() {
    this._revalidate(0)
    attemptElementFocus(this._tabs.activeTab().content)
  }

  _handleTabChange(...params: Parameters<TabChangeHandler>) {
    const [newTabname, , source] = params
    if (source !== "event") return
    this._revalidate(tabNameToQuizElementIndex(newTabname))
  }

  _revalidate(slideIndex: number) {
    const {
      _elementInstances,
      _controlPanel,
      _presentation,
      _progress,
      _metadata,
      _tabs
    } = this

    revalidateQuiz({
      slideIndex,
      elementInstances: _elementInstances,
      tabs: _tabs,
      controlPanel: _controlPanel,
      presentation: _presentation,
      progress: _progress,
      answerSelectionMode: _metadata.answerSelectionMode
    })
  }
}
