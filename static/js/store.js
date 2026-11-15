// The last successful pricing, kept in the browser so the Learn page's
// figures can start from the values used on the Pricer page.

window.BOP = window.BOP || {};

(function () {
    "use strict";

    const KEY = "bop:last-pricing";

    // Storage can be blocked or full; the pages work without it.
    function save(values) {
        try {
            localStorage.setItem(KEY, JSON.stringify({ ...values, pricedAt: Date.now() }));
        } catch (error) {
            console.warn("Couldn't save the last pricing:", error);
        }
    }

    // Returns { strike, option_type, option_price, pricedAt }, or null.
    function load() {
        try {
            const value = JSON.parse(localStorage.getItem(KEY));
            return value && typeof value === "object" ? value : null;
        } catch (error) {
            return null;
        }
    }

    BOP.lastPricing = { save, load };
})();
