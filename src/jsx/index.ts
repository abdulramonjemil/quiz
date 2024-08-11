import { JSXClassElementType, JSXElementType } from "./base"
import { RefHolder } from "./ref"

export type {
  JSXClassElementType,
  JSXElementType,
  JSXFunctionElementType,
  JSXIntrinsicElementType,
  ElementProps
} from "./base"

export { ns } from "./jsx-runtime/context"
export { Component, type ComponentProps } from "./component"
export { Slot, type SlotProps, type SlotRevalidator } from "./slot"

export {
  type RefHolder,
  type MutableRefHolder,
  type RefType,
  isMRH,
  isRH,
  mrh,
  rh
} from "./ref"

export {
  createContext,
  ContextProvider,
  isContextData,
  type Context,
  type ContextData,
  type ContextType
} from "./context"

export namespace CustomJSX {
  export type Element = Node
  export type ElementType = JSXElementType
  export type ElementClass = InstanceType<JSXClassElementType>

  export interface ElementAttributesProperty {
    $props: object
  }

  export interface ElementChildrenAttribute {
    children: object
  }

  export interface IntrinsicAttributes {
    nodeRefHolder?: RefHolder<Node>
  }

  export interface IntrinsicClassAttributes<T> {
    instanceRefHolder?: RefHolder<T>
  }

  export interface IntrinsicElements {
    [x: string]: { [x: string]: unknown; refHolder?: RefHolder<Element> }
  }
}
