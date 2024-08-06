// eslint-disable-next-line import/extensions
import { SAMPLE_QUIZ_DATA } from "./sample.js"

/**
 * @typedef {import("@/components/quiz/").QuizClass} QuizClass
 * @typedef {import("@/components/quiz/").QuizProps} QuizProps
 * @typedef {import("@/components/quiz/").QuizInquiryElement} QuizInquiryElement
 * @typedef {import("@/components/quiz/").FinalizedQuizInquiryElement} FinalizedQuizInquiryElement
 */

/**
 * @template {new (...params: any[]) => any} Constructor
 * @param {any} value
 * @param {Constructor} constructor
 * @returns {asserts value is InstanceType<Constructor>}
 */
export function assertIsInstance(value, constructor) {
  if (!(value instanceof constructor)) {
    throw new Error(
      `Expected ${value} to be an instance of '${constructor.name}'`
    )
  }
}

/**
 * @param {QuizInquiryElement[]} elements
 * @returns {FinalizedQuizInquiryElement[]}
 */
function createFinalizedInquiryElements(elements) {
  return elements.map(
    /** @returns {FinalizedQuizInquiryElement} */
    (element) => {
      if (element.type === "CODE_BOARD") return element
      return {
        selectedOptionIndex: Math.floor(Math.random() * element.options.length),
        ...element
      }
    }
  )
}

const { Quiz } = /** @type {{Quiz: QuizClass}} */ (
  /** @type {unknown} */ (window)
)

const container1 = document.getElementById("quiz-1")
const container2 = document.getElementById("quiz-2")
const container3 = document.getElementById("quiz-3")

assertIsInstance(container1, HTMLElement)
assertIsInstance(container2, HTMLElement)
assertIsInstance(container3, HTMLElement)

Quiz.create({
  container: container1,
  props: {
    header: "Test quiz 1",
    elements: SAMPLE_QUIZ_DATA.slice(2, 5),
    autosave: null,
    answerSelectionMode: "free",
    finalized: false,
    customRootClass: "sample-quiz-1",
    onSubmit: (data) => {
      // eslint-disable-next-line no-console
      console.log(data)
    }
  }
})

Quiz.create({
  container: container2,
  props: {
    header: "Test quiz 2",
    autosave: {
      identifier: "sample-quiz-2",
      saveWithPathname: false
    },
    // codeBoardTheme:
    //   "https://cdn.jsdelivr.net/gh/PrismJS/prism-themes/themes/prism-gruvbox-dark.css",
    customRootClass: "sample-quiz-2",
    animateResultIndicator: true,
    elements: SAMPLE_QUIZ_DATA.slice(11, 13),
    finalized: false,
    onSubmit: (data) => {
      // eslint-disable-next-line no-console
      console.log(data)
    }
  }
})

Quiz.create({
  container: container3,
  props: {
    autosave: null,
    customRootClass: "sample-quiz-3",
    elements: createFinalizedInquiryElements(SAMPLE_QUIZ_DATA.slice(9, 14)),
    finalized: true
  }
})
