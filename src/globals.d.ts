import { JSXElementType, RefHolder } from "@/core/base"

declare global {
  module "*.scss" {
    const content: Record<string, string>
    export default content
  }

  namespace JSX {
    type ElementType = JSXElementType

    interface ElementAttributesProperty {
      $props: {}
    }

    interface ElementChildrenAttribute {
      children: {}
    }

    interface IntrinsicAttributes {
      nodeRefHolder?: RefHolder<Node>
    }

    interface IntrinsicClassAttributes<T> {
      instanceRefHolder?: RefHolder<T>
    }

    interface IntrinsicElements {
      [x: string]: any
    }
  }
}
