import { resolveToNode } from "@/jsx/base"
import { Component } from "@/jsx/component"
import { isRH } from "@/jsx/ref"
import { isExtender } from "@/lib/value"
import { SpecialComponentProps } from "./base"

/**
 * @typedef {import("@/jsx/base").JSXFunctionElementType} JSXFunctionElementType
 * @typedef {import("@/jsx/base").JSXClassElementType} JSXClassElementType
 * @typedef {import("@/jsx/component").ComponentProps} ComponentProps
 * @typedef {import("./base").NormalizedElementProps} NormalizedElementProps
 * @typedef {import("./base").ElementChildren} ElementChildren
 */

/**
 * @param {NormalizedElementProps} elementProps
 * @param {Node} node
 * @param {Component} [instance]
 */
function assignComponentElementRef(elementProps, node, instance) {
  const instanceRH = elementProps[SpecialComponentProps.instanceRH]
  const nodeRH = elementProps[SpecialComponentProps.nodeRH]

  if (instance) {
    if (instanceRH !== undefined && instanceRH !== null) {
      if (!isRH(instanceRH)) throw new Error("Invalid instance ref holder")
      // @ts-expect-error
      instanceRH.ref = instance
    }
  }

  if (nodeRH !== undefined && nodeRH !== null) {
    if (!isRH(nodeRH)) {
      throw new Error("Invalid node ref holder")
    }
    // @ts-expect-error
    nodeRH.ref = node
  }
}

/**
 * @param {NormalizedElementProps} props
 * @param {ElementChildren} children
 * @returns {ComponentProps}
 */
function getComponentExecutionProps(props, children) {
  const componentProps = { ...props }
  const p = SpecialComponentProps
  ;[p.instanceRH, p.nodeRH].forEach((name) => {
    delete componentProps[name]
  })
  if (children !== undefined) componentProps.children = children
  return componentProps
}

/**
 * @param {JSXFunctionElementType | JSXClassElementType} func
 * @param {NormalizedElementProps} props
 * @param {ElementChildren} children
 */
export function createComponentElement(func, props, children) {
  const executionProps = getComponentExecutionProps(props, children)
  let node = /** @type {Node | null} */ (null)
  let instance = /** @type {Component | null} */ (null)

  if (isExtender(func, Component)) {
    // Component is class if error is thrown
    const C = func
    instance = new C(executionProps)
    node = instance.rootNode()
  } else {
    node = resolveToNode(
      /** @type {JSXFunctionElementType} */ (func).call(null, executionProps)
    )
  }

  assignComponentElementRef(props, node, instance ?? undefined)
  return node
}
