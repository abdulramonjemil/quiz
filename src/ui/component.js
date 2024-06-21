import { setElementHTMLAttribute } from "../lib/dom"
import {
  assertOverwrittenParentMethods,
  throwAbsentMethodError
} from "../lib/value"

/**
 * @typedef {HTMLElement |
 *   { ref: HTMLElement, [key: string]: unknown } |
 *   { ref: Record<string, HTMLElement>, [key: string]: unknown }
 * } ElementConfig
 *
 * @typedef {{elements: Record<
 *   string,
 *   ElementConfig | ElementConfig[]
 * >}} UIComponentConfig
 *
 * @typedef {Record<string, unknown>} UIComponentState
 * @typedef {Record<string, string | boolean>} UIElementAttributeSet
 *
 * @typedef {Record<
 *   string,
 *   UIElementAttributeSet | Record<string, UIElementAttributeSet>[]
 * >} UIComponentElementsAttributeSet
 */

/**
 * This class is used as an abstract class that actual UI components extend.
 *
 * @template {UIComponentConfig} [Config=UIComponentConfig]
 * @template {UIComponentState} [State=UIComponentState]
 */
export class UIComponent {
  /** @type {(extender: new (...args: any[]) => UIComponent ) => void} */
  static assertComponentValidity(extender) {
    assertOverwrittenParentMethods(UIComponent, extender, [
      "$doStaticMarkupRender",
      "$doEventHandlerSetup",
      "getStaticElementAttributeSets",
      "getManagedElementAttributeSets",
      "render"
    ])
  }

  /**
   * This is used to verify that the set of attributes (HTML attributes and
   * inline CSS properties) on an element are of the required shape.
   *
   * @type {(element: HTMLElement, attributes: UIElementAttributeSet) => void}
   */
  static setElementProperties(element, attributes) {
    Object.entries(attributes).forEach(([attributeName, attributeValue]) => {
      setElementHTMLAttribute(element, attributeName, attributeValue)
    })
  }

  /**
   * @param {Config} config
   * @param {State} state
   */
  constructor(config, state) {
    /**
     * @protected
     * @type {State}
     */
    this.$state = state

    /**
     * @protected
     * @type {Config}
     */
    this.$config = config

    this.$doStaticMarkupRender()
    this.$doEventHandlerSetup()
    this.render()
  }

  /**
   * @protected
   * @returns {void}
   */
  // eslint-disable-next-line class-methods-use-this
  $doEventHandlerSetup() {
    throwAbsentMethodError(this.constructor, "$doEventHandlerSetup")
  }

  /**
   * @protected
   * @returns {void}
   */
  // eslint-disable-next-line class-methods-use-this
  $doStaticMarkupRender() {
    throwAbsentMethodError(this.constructor, "$doStaticMarkupRender")
  }

  /** @type {() => UIComponentElementsAttributeSet} */
  // eslint-disable-next-line class-methods-use-this
  getManagedElementAttributeSets() {
    throwAbsentMethodError(this.constructor, "getManagedElementAttributeSets")
  }

  /** @type {() => UIComponentElementsAttributeSet} */
  // eslint-disable-next-line class-methods-use-this
  getStaticElementAttributeSets() {
    throwAbsentMethodError(this.constructor, "getStaticElementAttributeSets")
  }

  /**
   * This method sets appropriate managed element properties on elements of a UI
   * component based on the current state).
   *
   * @returns {void}
   */
  render() {
    throwAbsentMethodError(this.constructor, "render")
  }
}
