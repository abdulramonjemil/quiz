/** @type {import("@/components/quiz").QuizProps["elements"]} */
export const SAMPLE_QUIZ_DATA = [
  {
    type: "QUESTION",
    title: "What method can you use to add an item to the end of an array?",
    answerIndex: 1,
    options: ["unshift()", "push()", "pop()", "shift()"],
    explanation:
      "The push() method can be used to add one or more items to the end of an array, as demonstrated in the lesson content."
  },
  {
    type: "CODE_BOARD",
    title: "Whatever you think about the following code snippet",
    language: "js",
    snippet:
      'function invert(value) {\n  if (typeof value !== "string" || value === "") return 0\n  const highestCharCodeAtValue = 65536\n  const valueLength = value.length\n\n  let invertedValue = ""\n  for (let i = 0; i < valueLength; i++) {\n    const indexToUse = valueLength - 1 - i\n    const charCodeToUse = highestCharCodeAtValue - value.charCodeAt(indexToUse)\n    invertedValue += String.fromCharCode(charCodeToUse)\n  }\n\n  return invertedValue\n}\n'
  },
  {
    type: "QUESTION",
    title: "What do you think of my Hashnode Quiz widget?",
    answerIndex: 3,
    options: [
      "It's not a big thing",
      "I won't really care about it",
      "~~I love it since you used `webpack`",
      "Whatever"
    ],
    explanation:
      "~~There's absolutely no reason whatsoever to use `webpack`. Come to think of it, if `webpack` was really a good thing, why does a lot of people not like it at all. It just doesn't sense. So, just don't use `yaml` of `js-yaml`.\n"
  },
  {
    type: "QUESTION",
    title: "Do you think I hate food?",
    answerIndex: 3,
    options: [
      "Yes",
      "<>I know for a fact that you don't <b>hate</b>food",
      "~~I love it since you used `webpack`",
      "Whatever"
    ],
    explanation:
      "~~There's absolutely no reason whatsoever to use `webpack`. Come to think of it, if `webpack` was really a good thing, why does a lot of people not like it at all. It just doesn't sense. So, just don't use `yaml` of `js-yaml`.\n"
  },
  {
    type: "QUESTION",
    title: "Do you think I hate food?",
    answerIndex: 2,
    options: ["Yes", "~~I love it since you used `webpack`", "Whatever"]
  },
  {
    type: "CODE_BOARD",
    title: "Example of a simple C program",
    language: "c",
    snippet:
      '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}'
  },
  {
    type: "QUESTION",
    title: "What is the output of the above C program?",
    answerIndex: 0,
    options: ["Hello, World!", "Hello World", "hello, world!", "hello world"],
    explanation: "The program prints 'Hello, World!' followed by a newline."
  },
  {
    type: "QUESTION",
    title: "Which function is used to print text in C?",
    answerIndex: 1,
    options: ["scanf()", "printf()", "print()", "output()"],
    explanation: "The printf() function is used to print text in C."
  },
  {
    type: "CODE_BOARD",
    title: "Function to calculate the sum of two numbers in C",
    language: "c",
    snippet:
      '#include <stdio.h>\n\nint sum(int a, int b) {\n    return a + b;\n}\n\nint main() {\n    int result = sum(3, 4);\n    printf("The sum is %d\\n", result);\n    return 0;\n}'
  },
  {
    type: "QUESTION",
    title: "What will be the output of the sum function if a = 3 and b = 4?",
    answerIndex: 2,
    options: ["3", "4", "7", "12"],
    explanation: "The sum function returns the addition of a and b, which is 7."
  },
  {
    type: "QUESTION",
    title: "Which header file is necessary to include for using printf() in C?",
    answerIndex: 0,
    options: ["stdio.h", "stdlib.h", "string.h", "math.h"],
    explanation:
      "The stdio.h header file is necessary to include for using printf() in C."
  },
  {
    type: "CODE_BOARD",
    title: "Looping through an array in C",
    language: "c",
    snippet:
      '#include <stdio.h>\n\nint main() {\n    int arr[5] = {1, 2, 3, 4, 5};\n    for(int i = 0; i < 5; i++) {\n        printf("%d ", arr[i]);\n    }\n    return 0;\n}'
  },
  {
    type: "QUESTION",
    title: "What is the output of the above code snippet?",
    answerIndex: 1,
    options: ["12345", "1 2 3 4 5", "1,2,3,4,5", "5 4 3 2 1"],
    explanation:
      "The loop prints each element of the array separated by a space, resulting in '1 2 3 4 5'."
  },
  {
    type: "QUESTION",
    title:
      "What is the purpose of the return 0 statement in the main function?",
    answerIndex: 2,
    options: [
      "To print the value 0",
      "To initialize the program",
      "To indicate that the program ended successfully",
      "To create a new process"
    ],
    explanation:
      "The return 0 statement indicates that the program ended successfully."
  },
  {
    type: "QUESTION",
    title:
      "Which of the following is a correct way to declare an integer variable in C?",
    answerIndex: 0,
    options: ["int a;", "integer a;", "a = int;", "int: a"],
    explanation:
      "The correct way to declare an integer variable in C is 'int a;'."
  }
]
