import { AriaKeys } from "../lib/accessibility"
import { attemptElementFocus } from "../lib/focus"
import { findFirstMatchingItem } from "../lib/value"
import { UIComponent } from "./component"

/**
 * @typedef {{activeTabIndex: number}} TabsState
 * @typedef {"event" | "api"} TabChangeSource
 * @typedef {(
 *   newTabName: string,
 *   oldTabName: string
 *   source: TabChangeSource
 * ) => void | undefined} TabChangeHandler
 *
 * @typedef {{
 *   elements: {
 *     tablist: {
 *       ref: HTMLElement
 *       ariaLabel: string
 *     }
 *     tabItems: {
 *       name: string,
 *       triggerAriaLabel?: string | undefined
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
 * @extends {UIComponent<TabsConfig, TabsState>}
 */
export class Tabs extends UIComponent {
  /** @param {TabsConfig} config */
  constructor(config) {
    if (config.elements.tabItems.length < 1) {
      throw new Error("Expected one or more tab items")
    }

    const activeTabIndex = config.elements.tabItems.findIndex(
      ({ name }) => name === config.defaultTabName
    )

    if (activeTabIndex === -1) {
      throw throwInvalidTabNameError(config.defaultTabName)
    }

    /** @type {TabsState} */
    const DEFAULT_STATE = { activeTabIndex }
    super(config, DEFAULT_STATE)
  }

  $doEventHandlerSetup() {
    const { tabItems } = this.$config.elements
    tabItems.forEach(({ refs: { trigger } }, index) => {
      trigger.addEventListener("click", () => {
        this.$handleTabTriggerClick(index)
      })

      trigger.addEventListener("keydown", (event) => {
        if (
          event.key === AriaKeys.ArrowLeft ||
          event.key === AriaKeys.ArrowRight
        ) {
          const type = event.key === AriaKeys.ArrowLeft ? "left" : "right"
          this.$handleTabTriggerLeftRightKeyDown(type, event)
        }
      })
    })
  }

  $doStaticMarkupRender() {
    const { elements } = this.$config
    const attributes = this.getStaticElementAttributeSets()
    UIComponent.setElementProperties(elements.tablist.ref, attributes.tablist)
    elements.tabItems.forEach(({ refs }, index) => {
      const attrs = attributes.tabItems[index]
      UIComponent.setElementProperties(refs.trigger, attrs.trigger)
      UIComponent.setElementProperties(refs.content, attrs.content)
    })
  }

  /** @param {number} index */
  $handleTabTriggerClick(index) {
    const { activeTabIndex } = this.$getState()
    if (activeTabIndex === index) return

    const oldTabName = this.$config.elements.tabItems[activeTabIndex].name
    const newTabName = this.$config.elements.tabItems[index].name
    this.$setState({ activeTabIndex: index })
    this.$config.onTabChange?.(newTabName, oldTabName, "event")
  }

  /**
   * @param {"left" | "right"} type
   * @param {KeyboardEvent} event
   */
  $handleTabTriggerLeftRightKeyDown(type, event) {
    const { activeTabIndex } = this.$getState()
    const { tabItems } = this.$config.elements
    const array = type === "right" ? [...tabItems] : [...tabItems].reverse()
    const startIndex =
      type === "right" ? activeTabIndex + 1 : tabItems.length - activeTabIndex

    const focused = findFirstMatchingItem({
      array,
      startIndex,
      predicate: (item) => attemptElementFocus(item.refs.trigger),
      wrap: true
    })?.refs.trigger

    if (focused) {
      event.preventDefault()
      focused.click()
    }
  }

  getManagedElementAttributeSets() {
    const { elements } = this.$config
    const { activeTabIndex } = this.$getState()

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
    const { tablist, tabItems } = this.$config.elements

    return {
      tablist: {
        role: "tablist",
        "aria-label": tablist.ariaLabel
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
    this.$config.elements.tabItems.forEach(({ refs }, index) => {
      const attrs = attributes[index]
      UIComponent.setElementProperties(refs.trigger, attrs.trigger)
      UIComponent.setElementProperties(refs.content, attrs.content)
    })
  }

  /** @param {string} tabName */
  setActiveTab(tabName) {
    const { elements } = this.$config

    const intendedItemIndex = elements.tabItems.findIndex(
      (item) => item.name === tabName
    )

    if (intendedItemIndex === -1) {
      throwInvalidTabNameError(tabName)
    }

    const { activeTabIndex } = this.$getState()
    const oldTabName = this.$config.elements.tabItems[activeTabIndex].name

    this.$setState({ activeTabIndex: intendedItemIndex })
    this.$config.onTabChange?.(tabName, oldTabName, "api")
  }
}

UIComponent.assertComponentValidity(Tabs)
