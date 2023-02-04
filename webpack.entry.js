/**
 * This file is used as entry point for webpack. Quizzes can then be created
 * by calling 'Quiz.create' after linking the generated javascript file
 * with an HTML page (causing the object to be defined in the global scope).
 */

import Quiz from "./index"
import "./cq-polyfill" // Polyfill CSS @container queries

window.Quiz = Quiz
