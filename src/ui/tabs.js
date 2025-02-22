import { AriaKeys } from "@/lib/accessibility"
import { attemptElementFocus } from "@/lib/dom"
import {
  assertIsDefined,
  circularlyFindBackward,
  circularlyFindForward,
  findFirst,
  findLast
} from "@/lib/value"
import { UIComponent } from "./component"

/**
 * @typedef {{activeTabIndex: number}} TabsState
 * @typedef {"event" | "api"} TabChangeSource
 * @typedef {(
 *   newTabName: string,
 *   oldTabName: string,
 *   source: TabChangeSource
 * ) => void | undefined} TabChangeHandler
 *
 * @typedef {{
 *   elements: {
 *     tablist: {
 *       ref: HTMLElement
 *       ariaLabel?: string | null | undefined
 *     }
 *     tabItems: {
 *       name: string,
 *       triggerAriaLabel?: string | null | undefined
 *       triggerId: string,
 *       contentId: string,
 *       refs: {
 *         trigger: HTMLButtonElement,
 *         content: HTMLElement
 *       }
 *     }[]
 *   },
 *   onTabChange?: TabChangeHandler
 *   defaultTabName: string,
 * }} TabsConfig
 */

/** @param {string} tabName  */
function throwInvalidTabNameError(tabName) {
  throw new Error(`Cannot find tab with name: '${tabName}'`)
}

/**
 * @template {TabsConfig} [Config=TabsConfig]
 * @extends {UIComponent<Config, TabsState>}
 */
export class Tabs extends UIComponent {
  /** @param {Config} config */
  constructor(config) {
    if (config.elements.tabItems.length < 1) {
      throw new Error("Expected one or more tab items")
    }

    const activeTabIndex = config.elements.tabItems.findIndex(
      ({ name }) => name === config.defaultTabName
    )

    if (activeTabIndex === -1) {
      throwInvalidTabNameError(config.defaultTabName)
    }

    /** @type {TabsState} */
    const DEFAULT_STATE = { activeTabIndex }
    super(config, DEFAULT_STATE)
  }

  _doEventHandlerSetup() {
    const { tabItems } = this._config.elements
    tabItems.forEach(({ refs: { trigger } }, index) => {
      trigger.addEventListener("click", () => {
        this._handleTabTriggerClick(index)
      })

      trigger.addEventListener("keydown", (event) => {
        if (
          event.key === AriaKeys.ArrowLeft ||
          event.key === AriaKeys.ArrowRight
        ) {
          const type = event.key === AriaKeys.ArrowLeft ? "left" : "right"
          this._handleTabTriggerLeftRightKeyDown(event, type)
        }

        if (event.key === AriaKeys.Home || event.key === AriaKeys.End) {
          const type = event.key === AriaKeys.Home ? "home" : "end"
          this._handleTabTriggerHomeEndKeyDown(event, type)
        }
      })
    })
  }

  _doStaticMarkupRender() {
    const { elements } = this._config
    const attributes = this.getStaticElementAttributeSets()
    UIComponent.setElementAttributes(elements.tablist.ref, attributes.tablist)
    elements.tabItems.forEach(({ refs }, index) => {
      const attrs = attributes.tabItems[index]
      assertIsDefined(attrs, `tab item static attrs at index: ${index}`)
      UIComponent.setElementAttributes(refs.trigger, attrs.trigger)
      UIComponent.setElementAttributes(refs.content, attrs.content)
    })
  }

  /** @param {number} index */
  _handleTabTriggerClick(index) {
    const { activeTabIndex } = this._state
    if (activeTabIndex === index) return

    const oldTabItem = this._config.elements.tabItems[activeTabIndex]
    const newTabItem = this._config.elements.tabItems[index]

    assertIsDefined(oldTabItem, `old tab item at index: ${activeTabIndex}`)
    assertIsDefined(newTabItem, `new tab item at index: ${index}`)

    const oldTabName = oldTabItem.name
    const newTabName = newTabItem.name

    this._state = /** @satisfies {TabsState} */ { activeTabIndex: index }
    this.render()

    this._config.onTabChange?.(newTabName, oldTabName, "event")
  }

  /**
   * @param {KeyboardEvent} event
   * @param {"home" | "end"} type
   */
  _handleTabTriggerHomeEndKeyDown(event, type) {
    const { tabItems } = this._config.elements
    /** @param {(typeof tabItems)[number]} item */
    const acceptsFocus = (item) => attemptElementFocus(item.refs.trigger)

    const focused =
      type === "home"
        ? findFirst(tabItems, acceptsFocus)
        : findLast(tabItems, acceptsFocus)

    if (focused) {
      event.preventDefault()
      focused.refs.trigger.click()
    }
  }

  /**
   * @param {KeyboardEvent} event
   * @param {"left" | "right"} type
   */
  _handleTabTriggerLeftRightKeyDown(event, type) {
    const { activeTabIndex } = this._state
    const { tabItems } = this._config.elements

    /** @param {(typeof tabItems)[number]} item */
    const acceptsFocus = (item) => attemptElementFocus(item.refs.trigger)
    const focused =
      type === "left"
        ? circularlyFindBackward(tabItems, acceptsFocus, activeTabIndex - 1)
        : circularlyFindForward(tabItems, acceptsFocus, activeTabIndex + 1)

    if (focused) {
      event.preventDefault()
      focused.refs.trigger.click()
    }
  }

  activeTab() {
    const { activeTabIndex } = this._state
    const item = this._config.elements.tabItems[activeTabIndex]
    assertIsDefined(item, `active tab item at index: ${activeTabIndex}`)

    return {
      name: item.name,
      trigger: item.refs.trigger,
      content: item.refs.content
    }
  }

  getManagedElementAttributeSets() {
    const { elements } = this._config
    const { activeTabIndex } = this._state

    return {
      tabItems: elements.tabItems.map((item, index) => {
        const isActive = activeTabIndex === index
        const ariaSelected = isActive ? "true" : "false"

        return {
          content: { hidden: !isActive },
          trigger: {
            tabindex: isActive ? "0" : "-1",
            "aria-selected": ariaSelected
          }
        }
      })
    }
  }

  getStaticElementAttributeSets() {
    const { tablist, tabItems } = this._config.elements

    return {
      tablist: {
        role: "tablist",
        "aria-orientation": "horizontal",
        ...(tablist.ariaLabel && { "aria-label": tablist.ariaLabel })
      },
      tabItems: tabItems.map((item) => ({
        trigger: {
          id: item.triggerId,
          role: "tab",
          "aria-controls": item.contentId,
          ...(item.triggerAriaLabel && { "aria-label": item.triggerAriaLabel })
        },
        content: {
          id: item.contentId,
          role: "tabpanel",
          tabindex: "0",
          "aria-labelledby": item.triggerId
        }
      }))
    }
  }

  render() {
    const attributes = this.getManagedElementAttributeSets().tabItems
    this._config.elements.tabItems.forEach(({ refs }, index) => {
      const attrs = attributes[index]
      assertIsDefined(attrs, `tab item managed attrs at index: ${index}`)
      UIComponent.setElementAttributes(refs.trigger, attrs.trigger)
      UIComponent.setElementAttributes(refs.content, attrs.content)
    })
  }

  /** @param {string} tabName */
  setActiveTab(tabName) {
    const { elements } = this._config

    const intendedItemIndex = elements.tabItems.findIndex(
      (item) => item.name === tabName
    )

    if (intendedItemIndex === -1) {
      throwInvalidTabNameError(tabName)
    }

    const { activeTabIndex } = this._state
    const oldTabItem = this._config.elements.tabItems[activeTabIndex]
    assertIsDefined(oldTabItem, `old tab item at index: ${activeTabIndex}`)
    const oldTabName = oldTabItem.name

    this._state = /** @satisfies {TabsState} */ {
      activeTabIndex: intendedItemIndex
    }
    this.render()

    this._config.onTabChange?.(tabName, oldTabName, "api")
  }
}

UIComponent.assertComponentValidity(Tabs)
