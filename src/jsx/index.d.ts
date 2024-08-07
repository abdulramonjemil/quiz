import { JSXClassElementType, JSXElementType } from "./base"
import { RefHolder } from "./ref"

export type {
  JSXClassElementType,
  JSXElementType,
  JSXFunctionElementType,
  JSXIntrinsicElementType,
  ElementProps
} from "./base"

export { ns } from "./jsx-runtime"
export { Component, type ComponentProps } from "./component"
export { Slot, type SlotProps, type SlotRevalidator } from "./slot"

export {
  type RefHolder,
  type MutableRefHolder,
  isMRH,
  isRH,
  mrh,
  rh
} from "./ref"

export {
  ctx,
  ContextProvider,
  isContextData,
  type Context,
  type ContextData
} from "./context"

export namespace CustomJSX {
  type Element = Node
  type ElementType = JSXElementType
  type ElementClass = InstanceType<JSXClassElementType>

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
    [x: string]: { [x: string]: any; refHolder?: RefHolder<Element> }
  }
}
