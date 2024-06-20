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
 *   - aria-label (optional)
 * - Panel trigger / managed
 *   - aria-selected
 *   - tabindex
 *
 * - Panel content / static
 *   - id
 *   - role
 *   - aria-labelledby={{trigger.id}}
 *   - tabindex
 * - Panel content / managed
 *   - hidden
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
 *
 * TAB NOTES
 * - Let tab know when changing panels
 * - Let tab accept functions to initiate panel changes.
 * - Change Toggle result to "Jump to result"
 */
