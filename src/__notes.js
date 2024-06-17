/**
 * TAB STATE
 * - selected tab index.
 *
 * TAB ELEMENT PROPERTIES
 * - Tablist / static
 *   - aria-label
 *   - role
 *
 * - Panel trigger / static
 *   - id
 *   - role
 *   - aria-controls={{content.id}}
 * - Panel trigger / managed
 *   - aria-selected
 *   - tabindex
 *
 * - Panel content / static
 *   - id
 *   - role
 *   - aria-labelledby={{trigger.id}}
 * - Panel content / managed
 *   - hidden
 *   - tabindex
 *
 * TAB EVENTS / CHANGES
 * - Space / Enter / Click on Item Trigger.
 *   - State: Not current item.
 *   - Change: Show panel, hide other panels.
 * - Arrow Right/Down or Arrow Left/Up on Item Trigger.
 *   - State: __
 *   - Change: Trigger click on prev / next trigger or wraps when needed.
 * - Home / End on Item Trigger.
 *   - State: __
 *   - Change: Trigger click on first / last trigger.
 */
