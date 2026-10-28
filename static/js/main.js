// Dashboard: collects model parameters, posts them to /api/price,
// and renders the returned option price and lattices.

(function () {
    "use strict";

    const API_URL = "/api/price";

    const form = document.getElementById("pricing-form");
    const submitButton = document.getElementById("submit-button");
    const status = document.getElementById("form-status");
    const priceOutput = document.getElementById("option-price");

    const latticeOutputs = {
        price: document.getElementById("lattice-price"),
        delta: document.getElementById("lattice-delta"),
        leverage: document.getElementById("lattice-leverage"),
    };

    // Field name -> parser. Names match the keys the engine reads.
    const FIELDS = {
        spot: parseFloat,
        strike: parseFloat,
        volatility: parseFloat,
        risk_free_rate: parseFloat,
        time_to_expiry: parseFloat,
        num_layers: (value) => parseInt(value, 10),
    };

    function setStatus(message, isError) {
        status.textContent = message;
        status.classList.toggle("is-error", Boolean(isError));
    }

    function readParameters() {
        const params = {};
        const invalid = [];

        for (const [name, parse] of Object.entries(FIELDS)) {
            const input = form.elements[name];
            const value = parse(input.value);
            const ok = input.value.trim() !== "" && Number.isFinite(value);

            input.setAttribute("aria-invalid", ok ? "false" : "true");
            if (ok) {
                params[name] = value;
            } else {
                invalid.push(input.labels[0].textContent);
            }
        }

        return { params, invalid };
    }

    function formatPrice(value) {
        if (typeof value === "number" && Number.isFinite(value)) {
            return value.toFixed(4);
        }
        return value === null || value === undefined ? "—" : String(value);
    }

    function formatLattice(value) {
        if (value === null || value === undefined) {
            return "—";
        }
        return typeof value === "string" ? value : JSON.stringify(value);
    }

    function render(result) {
        priceOutput.textContent = formatPrice(result.binomial_option_price);

        const lattices = result.binomial_lattices || {};
        for (const [key, element] of Object.entries(latticeOutputs)) {
            element.textContent = formatLattice(lattices[key]);
        }
    }

    async function submit(event) {
        event.preventDefault();

        const { params, invalid } = readParameters();
        if (invalid.length > 0) {
            setStatus("Please enter a number for: " + invalid.join(", "), true);
            return;
        }

        submitButton.disabled = true;
        setStatus("Pricing…", false);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params),
            });

            // Read as text first so a non-JSON error page can still be reported.
            const body = await response.text();
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status} ${response.statusText}`);
            }

            let result;
            try {
                result = JSON.parse(body);
            } catch (parseError) {
                throw new Error("Response was not valid JSON");
            }

            render(result);
            setStatus("Updated " + new Date().toLocaleTimeString(), false);
        } catch (error) {
            setStatus(error.message, true);
        } finally {
            submitButton.disabled = false;
        }
    }

    form.addEventListener("submit", submit);
})();
