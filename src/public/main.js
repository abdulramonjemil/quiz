// eslint-disable-next-line import/extensions
import { SAMPLE_QUIZ_DATA } from "./sample.js"

const main = document.getElementById("quiz")
const { Quiz } = window

const sampleProps = {
  elements: SAMPLE_QUIZ_DATA,
  metadata: {
    autoSave: false,
    storedData: {
      questionMetadataSet: [{ selectedOption: "B" }],
      elementsCount: 2
    },
    header: "Test your knowledge",
    storageKey: "kajhaikaahoijldahadai-wof9q0",
    isGlobal: false
  },
  submissionCallback: (...all) => {
    console.log(all)
  }
}

Quiz.create({
  container: main,
  props: sampleProps
})
