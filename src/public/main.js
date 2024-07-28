// eslint-disable-next-line import/extensions
import { SAMPLE_QUIZ_DATA } from "./sample.js"

/**
 * @typedef {import("@/components/quiz").QuizClass} QuizClass
 * @typedef {import("@/components/quiz").QuizProps} QuizProps
 * @typedef {import("@/components/quiz").QuizInquiryElement} QuizInquiryElement
 * @typedef {import("@/components/quiz").FinalizedQuizInquiryElement} FinalizedQuizInquiryElement
 */

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

const { Quiz } = /** @type {{Quiz: QuizClass}} */ (window)

const container1 = document.getElementById("quiz-1")
const container2 = document.getElementById("quiz-2")
const container3 = document.getElementById("quiz-3")

Quiz.create({
  container: container1,
  props: {
    header: "Test quiz 1",
    elements: SAMPLE_QUIZ_DATA.slice(0, 5),
    autosave: null,
    finalized: false,
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
    header: "Test quiz 3",
    autosave: null,
    elements: createFinalizedInquiryElements(SAMPLE_QUIZ_DATA.slice(9, 14)),
    finalized: true
  }
})
