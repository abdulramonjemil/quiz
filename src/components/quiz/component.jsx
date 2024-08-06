import { mrh, rh, Component } from "@/jsx"
import { attemptElementFocus, cn } from "@/lib/dom"
import { uniqueId } from "@/lib/factory"
import { assertIsDefined, assertIsInstance, bind } from "@/lib/value"
import { Tabs } from "@/ui"

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
    const p = Quiz.prototype
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

    const getThis = () => quizRH.ref
    const { elementNodes, elementInstances } = buildQuizSlideElements({
      elements: fullQuizElements,
      codeBoardTheme,
      animateResultIndicator,
      getResultSummaryText: getResultSummaryText ? proxiedGetSummaryText : null,
      handleQuestionOptionChange: bind(p.$handleQuestionOptionChange, getThis),
      handleResultCTAButtonClick: bind(p.$handleResultCTAButtonClick, getThis)
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
        tabs
      }
    })
    const RootElementType = rootElementType ?? "div"

    const quizNode = (
      // @ts-expect-error
      <RootElementType className={cn(customRootClass, quizClasses.root)}>
        <div
          aria-labelledby={quizLabellingId}
          tabIndex={-1}
          onKeyDownCapture={shortcutHandlers.keydown}
          onKeyUpCapture={shortcutHandlers.keyup}
          className={quizClasses.inner}
        >
          <Header labellingId={quizLabellingId} level={headerLevel}>
            {header}
          </Header>
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
            handlePrevButtonClick={bind(
              p.$handleCPanelBtnClick,
              getThis,
              "prev"
            )}
            handleNextButtonClick={bind(
              p.$handleCPanelBtnClick,
              getThis,
              "next"
            )}
            handleCTAButtonClick={() => {
              const shouldJumpToResult = resultInstance.isFinalized()
              if (shouldJumpToResult) this.$handleCPanelResultJumpCTAClick()
              else this.$handleCPanelSubmitCTAClick()
            }}
            instanceRefHolder={cPanelRH}
          />
        </div>
      </RootElementType>
    )

    const appropriateIndex = resultInstance.isFinalized() ? resultIndex : 0

    tabs = setupQuizTabs({
      tablistLabel: header,
      elements: fullQuizElements,
      progress: progressRH.ref,
      presentation: presentationRH.ref,
      defaultTabIndex: appropriateIndex,
      tabChangeHandler: bind(p.$handleTabChange, getThis)
    })

    revalidateQuiz({
      slideIndex: appropriateIndex,
      elementInstances,
      progress: progressRH.ref,
      controlPanel: cPanelRH.ref,
      presentation: presentationRH.ref,
      tabs
    })

    super(props, quizNode)

    quizRH.ref = this

    this.$metadata =
      /** @type {{ autoSave: false } | { autoSave: true, storageKey: string }} */ ({
        autoSave: Boolean(autosave),
        ...(!!autosave && { storageKey: getStorageKey(autosave) })
      })
    this.$elementInstances = elementInstances

    this.$tabs = tabs
    this.$progress = progressRH.ref
    this.$presentation = presentationRH.ref
    this.$controlPanel = cPanelRH.ref
  }

  /** @param {"prev" | "next"} button */
  $handleCPanelBtnClick(button) {
    const { $elementInstances, $presentation } = this
    const { allowedPrevIndex, allowedNextIndex } = getQuizDataForSlide(
      $elementInstances,
      $presentation.currentSlideIndex()
    ).slide

    const appropriateIndex =
      button === "prev" ? allowedPrevIndex : allowedNextIndex
    if (typeof appropriateIndex !== "number") return
    this.$revalidate(appropriateIndex)
  }

  $handleCPanelSubmitCTAClick() {
    const availableFinalizedElements = getAvailableFinalizedElements({
      elements: this.$props.elements,
      elementInstances: this.$elementInstances,
      previouslyFinalized: this.$props.finalized,
      autoSaveConfig: this.$props.autosave
    })

    const desc = "available finalized element when clicking submit"
    assertIsDefined(availableFinalizedElements, desc)

    finalizeQuiz(availableFinalizedElements, this.$elementInstances)
    this.$revalidate(this.$elementInstances.length - 1)

    if (this.$metadata.autoSave) {
      storeQuizData(availableFinalizedElements, this.$metadata.storageKey)
    }

    if (typeof this.$props.onSubmit === "function") {
      const data = getQuizFinalizationData(availableFinalizedElements)
      this.$props.onSubmit.call(null, data)
    }
  }

  $handleCPanelResultJumpCTAClick() {
    const { $elementInstances } = this
    const resultIndexIfPresent = $elementInstances.length - 1
    this.$revalidate(resultIndexIfPresent)
  }

  $handleQuestionOptionChange() {
    const currentSlideIndex = this.$presentation.currentSlideIndex()
    this.$revalidate(currentSlideIndex)
  }

  $handleResultCTAButtonClick() {
    this.$revalidate(0)
    attemptElementFocus(this.$tabs.activeTab().content)
  }

  /** @type {TabChangeHandler} */
  $handleTabChange(newTabname, _, source) {
    if (source !== "event") return
    this.$revalidate(tabNameToQuizElementIndex(newTabname))
  }

  /** @param {number} slideIndex */
  $revalidate(slideIndex) {
    const {
      $elementInstances,
      $controlPanel,
      $presentation,
      $progress,
      $tabs
    } = this

    revalidateQuiz({
      slideIndex,
      elementInstances: $elementInstances,
      tabs: $tabs,
      controlPanel: $controlPanel,
      presentation: $presentation,
      progress: $progress
    })
  }
}
