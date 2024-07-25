// eslint-disable-next-line import/extensions
import { SAMPLE_QUIZ_DATA } from "./sample.js"

/**
 * @typedef {import("../components/quiz").QuizClass} QuizClass
 * @typedef {import("../components/quiz").QuizProps} QuizProps
 */

// eslint-disable-next-line prefer-destructuring
const Quiz = /** @type {QuizClass} */ (window.Quiz)

const firstQuizContainer = document.getElementById("quiz-1")
const secondQuizContainer = document.getElementById("quiz-2")

Quiz.create({
  container: firstQuizContainer,
  props: {
    elements: SAMPLE_QUIZ_DATA.slice(0, 5),
    metadata: {
      autoSave: true,
      // autoSave: false,
      // storedData: {
      //   questionMetadataSet: [{ selectedOption: "B" }],
      //   elementsCount: 2
      // },
      header: "Test your knowledge of arrays",
      storageKey: "sample-quiz-1",
      isGlobal: false
    },
    submissionCallback: (...all) => {
      console.log(all)
    }
  }
})

Quiz.create({
  container: secondQuizContainer,
  props: {
    elements: SAMPLE_QUIZ_DATA.slice(6, 7),
    metadata: {
      autoSave: true,
      // autoSave: false,
      // storedData: {
      //   questionMetadataSet: [{ selectedOption: "B" }],
      //   elementsCount: 2
      // },
      header: "Test your knowledge of C",
      storageKey: "sample-quiz-2",
      isGlobal: false
    },
    submissionCallback: (...all) => {
      console.log(all)
    }
  }
})
