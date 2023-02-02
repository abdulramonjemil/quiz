/**
 * This file is used as entry point for webpack. Quizzes can then be created
 * by calling 'createQuiz' after linking the generated javascript file
 * with an HTML page causing the function to be defined in the global scope.
 */

import Quiz from "./index"

window.$Quiz = Quiz
