import { mrh, rh, Component } from "@/jsx"
import { attemptElementFocus, cn } from "@/lib/dom"
import { uniqueId } from "@/lib/factory"
import { assertIsDefined, assertIsInstance, bindReturn } from "@/lib/value"
import { Tabs } from "@/ui/tabs"

// Import before components to allow overrides
import "@/scss/quiz.module.scss"

import Header from "@/components/header"
import Progress from "@/components/progress"
import Presentation from "@/components/presentation"
import Result from "@/components/result"
import ControlPanel from "@/components/control-panel"

import { finalizeQuiz, getQuizFinalizationData } from "./finalization"
import { createQuizShortcutHandlersCreator, setupQuizTabs } from "./behaviour"

import {
  getQuizDataForSlide,
  quizClasses,
  tabNameToQuizElementIndex
} from "./base"
import { revalidateQuiz } from "./revalidation"

import {
  assertValidQuizPropsElementConfig,
  buildQuizSlideElements,
  getAvailableFinalizedElements
} from "./element"
import { getStorageKey, storeQuizData } from "./storage"

/**
 * @typedef {import("@/ui/tabs").TabChangeHandler} TabChangeHandler
 *
 * @typedef {import("./base").QuizProps} QuizProps
 * @typedef {import("./base").QuizSlideElement} QuizSlideElement
 * @typedef {import("./base").QuizElementInstance} QuizElementInstance
 */

/**
 * @template {QuizProps} [Props=QuizProps]
 * @extends {Component<Props>}
 */
export class Quiz extends Component {
  /**
   * @param {{
   *   props: QuizProps,
   *   container?: Element | undefined
   * }} param0
   */
  static create({ props, container }) {
    const containerIsElementInstance = container instanceof Element
    const instanceRefHolder = /** @type {typeof rh<Quiz>} */ (rh)(null)
    const quizElement = (
      <Quiz {...props} instanceRefHolder={instanceRefHolder} />
    )
    if (containerIsElementInstance) container.replaceChildren(quizElement)
    return /** @type {const} */ ([quizElement, instanceRefHolder.ref])
  }

  /** @param {Props} props */
  constructor(props) {
    const {
      autosave,
      animateResultIndicator,
      customRootClass,
      elements,
      answerSelectionMode,
      finalized,
      header,
      headerLevel,
      rootElementType,
      codeBoardTheme,
      getResultSummaryText
    } = props

    assertValidQuizPropsElementConfig(elements)
    /** @type {QuizSlideElement[]} */
    const fullQuizElements = [...elements, { type: "RESULT" }]
    const qPrototype = Quiz.prototype
    const quizRH = /** @type {typeof mrh<Quiz>} */ (mrh)(null)
    const instanceRH = /** @type {typeof mrh<QuizElementInstance[]>} */ (mrh)(
      null
    )

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
      elements: fullQuizElements,
      codeBoardTheme,
      animateResultIndicator,
      getResultSummaryText: getResultSummaryText ? proxiedGetSummaryText : null,
      handleQuestionOptionChange: bindReturn(
        // eslint-disable-next-line @typescript-eslint/unbound-method
        qPrototype._handleQuestionOptionChange,
        () => [quizRH.ref]
      ),
      handleResultCTAButtonClick: bindReturn(
        // eslint-disable-next-line @typescript-eslint/unbound-method
        qPrototype._handleResultCTAButtonClick,
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

    const quizAnswerSelectionMode = answerSelectionMode ?? "sequential"
    const progressRH = /** @type {typeof rh<Progress>} */ (rh)(null)
    const presentationRH = /** @type {typeof rh<Presentation>} */ (rh)(null)
    const cPanelRH = /** @type {typeof rh<ControlPanel>} */ (rh)(null)
    let tabs = /** @type {Tabs | null} */ (null)

    const createQuizShortcutHandlers = createQuizShortcutHandlersCreator()
    const shortcutHandlers = createQuizShortcutHandlers(() => {
      assertIsInstance(tabs, Tabs)
      return {
        elementInstances,
        controlPanel: cPanelRH.ref,
        presentation: presentationRH.ref,
        progress: progressRH.ref,
        answerSelectionMode: quizAnswerSelectionMode,
        tabs
      }
    })

    const RootElementType = rootElementType ?? "div"

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
              qPrototype._handleCPanelBtnClick,
              () => [quizRH.ref, /** @type {const} */ ("prev")]
            )}
            handleNextButtonClick={bindReturn(
              // eslint-disable-next-line @typescript-eslint/unbound-method
              qPrototype._handleCPanelBtnClick,
              () => [quizRH.ref, /** @type {const} */ ("next")]
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
      elements: fullQuizElements,
      progress: progressRH.ref,
      presentation: presentationRH.ref,
      defaultTabIndex: appropriateIndex,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      tabChangeHandler: bindReturn(qPrototype._handleTabChange, () => [
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
      answerSelectionMode: quizAnswerSelectionMode
    })

    super(props, quizNode)

    quizRH.ref = this

    /**
     * @typedef {(
     *   | { enabled: false, storageKey: null }
     *   | { enabled: true, storageKey: string }
     * )} AutosaveMetadata
     */
    const autosaveMetadata = /** @type {AutosaveMetadata} */ ({
      enabled: Boolean(autosave),
      storageKey: autosave ? getStorageKey(autosave) : null
    })

    this._metadata = {
      autosave: autosaveMetadata,
      answerSelectionMode: quizAnswerSelectionMode
    }
    this._elementInstances = elementInstances

    this._tabs = tabs
    this._progress = progressRH.ref
    this._presentation = presentationRH.ref
    this._controlPanel = cPanelRH.ref
  }

  /** @param {"prev" | "next"} button */
  _handleCPanelBtnClick(button) {
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

  /** @type {TabChangeHandler} */
  _handleTabChange(newTabname, _, source) {
    if (source !== "event") return
    this._revalidate(tabNameToQuizElementIndex(newTabname))
  }

  /** @param {number} slideIndex */
  _revalidate(slideIndex) {
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
