import { AriaKeys } from "../lib/accessibility"
import { attemptElementFocus } from "../lib/dom"
import {
  circularlyFindBackward,
  circularlyFindForward,
  findFirst,
  findLast
} from "../lib/value"
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
          this.$handleTabTriggerLeftRightKeyDown(event, type)
        }

        if (event.key === AriaKeys.Home || event.key === AriaKeys.End) {
          const type = event.key === AriaKeys.Home ? "home" : "end"
          this.$handleTabTriggerHomeEndKeyDown(event, type)
        }
      })
    })
  }

  $doStaticMarkupRender() {
    const { elements } = this.$config
    const attributes = this.getStaticElementAttributeSets()
    UIComponent.setElementAttributes(elements.tablist.ref, attributes.tablist)
    elements.tabItems.forEach(({ refs }, index) => {
      const attrs = attributes.tabItems[index]
      UIComponent.setElementAttributes(refs.trigger, attrs.trigger)
      UIComponent.setElementAttributes(refs.content, attrs.content)
    })
  }

  /** @param {number} index */
  $handleTabTriggerClick(index) {
    const { activeTabIndex } = this.$state
    if (activeTabIndex === index) return

    const oldTabName = this.$config.elements.tabItems[activeTabIndex].name
    const newTabName = this.$config.elements.tabItems[index].name

    this.$state = /** @satisfies {TabsState} */ { activeTabIndex: index }
    this.render()

    this.$config.onTabChange?.(newTabName, oldTabName, "event")
  }

  /**
   * @param {KeyboardEvent} event
   * @param {"home" | "end"} type
   */
  $handleTabTriggerHomeEndKeyDown(event, type) {
    const { tabItems } = this.$config.elements
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
  $handleTabTriggerLeftRightKeyDown(event, type) {
    const { activeTabIndex } = this.$state
    const { tabItems } = this.$config.elements

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
    const { activeTabIndex } = this.$state
    const item = this.$config.elements.tabItems[activeTabIndex]

    return {
      name: item.name,
      trigger: item.refs.trigger,
      content: item.refs.content
    }
  }

  getManagedElementAttributeSets() {
    const { elements } = this.$config
    const { activeTabIndex } = this.$state

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
        "aria-label": tablist.ariaLabel,
        "aria-orientation": "horizontal"
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
      UIComponent.setElementAttributes(refs.trigger, attrs.trigger)
      UIComponent.setElementAttributes(refs.content, attrs.content)
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

    const { activeTabIndex } = this.$state
    const oldTabName = this.$config.elements.tabItems[activeTabIndex].name

    this.$state = /** @satisfies {TabsState} */ {
      activeTabIndex: intendedItemIndex
    }
    this.render()

    this.$config.onTabChange?.(tabName, oldTabName, "api")
  }
}

UIComponent.assertComponentValidity(Tabs)
