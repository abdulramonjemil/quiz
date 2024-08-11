import { CustomJSX } from "@/jsx"

declare global {
  // @ts-expect-error -- For some reason, TS throws an error here even though it
  // works (define default export of scss files as Record<string, string>)
  module "*.scss" {
    const content: Record<string, string>
    export default content
  }

  namespace JSX {
    type Element = CustomJSX.Element
    type ElementType = CustomJSX.ElementType
    type ElementClass = CustomJSX.ElementClass

    interface ElementAttributesProperty
      extends CustomJSX.ElementAttributesProperty {}

    interface ElementChildrenAttribute
      extends CustomJSX.ElementChildrenAttribute {}

    interface IntrinsicAttributes extends CustomJSX.IntrinsicAttributes {}

    interface IntrinsicClassAttributes<T>
      extends CustomJSX.IntrinsicClassAttributes<T> {}

    interface IntrinsicElements extends CustomJSX.IntrinsicElements {}
  }
}
