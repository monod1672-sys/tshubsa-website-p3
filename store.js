(() => {
    const storageKey = "tshubsa-cart-v1";
    const cart = new Map();
    const cartPanel = document.querySelector("#cart-panel");
    const cartToggle = document.querySelector("#cart-toggle");
    const cartBackdrop = document.querySelector("#cart-backdrop");
    const cartItems = document.querySelector("#cart-items");
    const cartCount = document.querySelector("#cart-count");
    const itemCount = document.querySelector("#cart-item-count");
    const subtotal = document.querySelector("#cart-subtotal");
    const shippingTotal = document.querySelector("#cart-shipping");
    const cartTotal = document.querySelector("#cart-total");
    const checkoutDialog = document.querySelector("#checkout-dialog");
    const checkoutSummary = document.querySelector("#checkout-summary");
    const checkoutTotal = document.querySelector("#checkout-total");
    const paymentAmount = document.querySelector("#payment-amount");
    const checkoutForm = document.querySelector("#checkout-form");
    const emailStatus = document.querySelector("#email-status");
    const placeOrderButton = checkoutForm.querySelector("[type='submit']");
    const priceNumber = new Intl.NumberFormat("en-ZA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    const shippingCost = 20000;

    const productCards = [...document.querySelectorAll(".product-card")];
    const catalog = new Map(productCards.map((card, index) => {
        const name = card.querySelector("h4").textContent.trim();
        const productId = card.id || `product-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        const priceText = card.querySelector(".product-price").textContent;
        const price = Math.round(Number(priceText.replace(/[^\d.]/g, "")) * 100);

        return [productId, {
            id: productId,
            name,
            brand: card.querySelector(".product-brand").textContent.trim(),
            image: card.querySelector(".product-image").getAttribute("src"),
            price,
            sizes: [...card.querySelectorAll(".size-select option")].map(option => option.value || option.textContent.trim())
        }];
    }));

    function formatPrice(cents) {
        return `R ${priceNumber.format(cents / 100)}`;
    }

    function saveCart() {
        try {
            localStorage.setItem(storageKey, JSON.stringify([...cart.values()]));
        } catch {
            // The cart remains usable for this page session when storage is unavailable.
        }
    }

    function loadCart() {
        try {
            const storedCart = JSON.parse(localStorage.getItem(storageKey) || "[]");
            if (!Array.isArray(storedCart)) return;

            for (const item of storedCart) {
                const product = catalog.get(item.id);
                if (!product || !product.sizes.includes(item.size)) continue;
                if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) continue;

                const key = `${product.id}::${item.size}`;
                cart.set(key, { ...product, size: item.size, quantity: item.quantity });
            }
        } catch {
            try {
                localStorage.removeItem(storageKey);
            } catch {
                // Storage can be disabled by the browser.
            }
        }
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function getCartTotals() {
        let quantity = 0;
        let subtotalAmount = 0;
        for (const item of cart.values()) {
            quantity += item.quantity;
            subtotalAmount += item.price * item.quantity;
        }
        const shippingAmount = quantity > 0 ? shippingCost : 0;
        return {
            quantity,
            subtotalAmount,
            shippingAmount,
            amount: subtotalAmount + shippingAmount
        };
    }

    function changeQuantity(key, adjustment) {
        const item = cart.get(key);
        if (!item) return;
        item.quantity = Math.min(99, Math.max(1, item.quantity + adjustment));
        saveCart();
        renderCart();
    }

    function removeItem(key) {
        cart.delete(key);
        saveCart();
        renderCart();
    }

    function renderCart() {
        cartItems.replaceChildren();
        const { quantity, subtotalAmount, shippingAmount, amount } = getCartTotals();
        cartCount.textContent = quantity;
        cartCount.hidden = quantity === 0;
        cartToggle.setAttribute("aria-label", `Open shopping cart, ${quantity} ${quantity === 1 ? "item" : "items"}`);
        itemCount.textContent = `(${quantity})`;
        subtotal.textContent = formatPrice(subtotalAmount);
        shippingTotal.textContent = formatPrice(shippingAmount);
        cartTotal.textContent = formatPrice(amount);
        document.querySelector("#start-checkout").disabled = quantity === 0;

        if (cart.size === 0) {
            cartItems.append(createElement("p", "empty-cart", "Your cart is empty."));
            return;
        }

        for (const [key, item] of cart) {
            const row = createElement("article", "cart-item");
            const image = document.createElement("img");
            image.src = item.image;
            image.alt = "";
            row.append(image);

            const details = createElement("div", "cart-item-details");
            details.append(
                createElement("strong", "", item.name),
                createElement("span", "", `${item.brand} / Size ${item.size}`),
                createElement("b", "", formatPrice(item.price * item.quantity))
            );

            const controls = createElement("div", "cart-item-controls");
            const decrease = createElement("button", "quantity-control", "-");
            decrease.type = "button";
            decrease.disabled = item.quantity <= 1;
            decrease.setAttribute("aria-label", `Decrease ${item.name} quantity`);
            decrease.addEventListener("click", () => changeQuantity(key, -1));

            const quantityLabel = createElement("span", "cart-quantity", String(item.quantity));
            const increase = createElement("button", "quantity-control", "+");
            increase.type = "button";
            increase.disabled = item.quantity >= 99;
            increase.setAttribute("aria-label", `Increase ${item.name} quantity`);
            increase.addEventListener("click", () => changeQuantity(key, 1));

            const remove = createElement("button", "remove-item", "Remove");
            remove.type = "button";
            remove.addEventListener("click", () => removeItem(key));
            controls.append(decrease, quantityLabel, increase, remove);
            row.append(details, controls);
            cartItems.append(row);
        }
    }

    function openCart() {
        cartPanel.classList.add("is-open");
        cartPanel.removeAttribute("inert");
        cartPanel.setAttribute("aria-hidden", "false");
        cartBackdrop.hidden = false;
        document.querySelector("#close-cart").focus();
    }

    function closeCart() {
        cartPanel.classList.remove("is-open");
        cartPanel.setAttribute("inert", "");
        cartPanel.setAttribute("aria-hidden", "true");
        cartBackdrop.hidden = true;
    }

    function renderCheckoutSummary() {
        checkoutSummary.replaceChildren();
        for (const item of cart.values()) {
            checkoutSummary.append(createElement(
                "p",
                "",
                `${item.name} / ${item.size} x ${item.quantity} - ${formatPrice(item.price * item.quantity)}`
            ));
        }
        const { subtotalAmount, shippingAmount, amount } = getCartTotals();
        checkoutSummary.append(
            createElement("p", "checkout-summary-total", `Subtotal: ${formatPrice(subtotalAmount)}`),
            createElement("p", "checkout-summary-total", `Shipping: ${formatPrice(shippingAmount)}`)
        );
        checkoutTotal.textContent = formatPrice(amount);
        paymentAmount.textContent = formatPrice(amount);
    }

    document.querySelectorAll(".product-card .add-button").forEach(button => {
        button.addEventListener("click", () => {
            const card = button.closest(".product-card");
            const product = [...catalog.values()].find(item => item.name === card.querySelector("h4").textContent.trim());
            const size = card.querySelector(".size-select").value;
            const quantityInput = card.querySelector(".quantity-input");
            const quantity = Number(quantityInput.value);

            if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
                quantityInput.setCustomValidity("Enter a whole number from 1 to 99.");
                quantityInput.reportValidity();
                quantityInput.addEventListener("input", () => quantityInput.setCustomValidity(""), { once: true });
                return;
            }

            const key = `${product.id}::${size}`;
            const current = cart.get(key);
            cart.set(key, { ...product, size, quantity: Math.min(99, quantity + (current?.quantity || 0)) });
            saveCart();
            renderCart();
            const originalText = button.textContent;
            button.textContent = "Added";
            window.setTimeout(() => { button.textContent = originalText; }, 900);
        });
    });

    cartToggle.addEventListener("click", event => {
        event.preventDefault();
        openCart();
    });
    document.querySelector("#close-cart").addEventListener("click", closeCart);
    cartBackdrop.addEventListener("click", closeCart);
    document.querySelector("#start-checkout").addEventListener("click", () => {
        closeCart();
        renderCheckoutSummary();
        checkoutDialog.showModal();
        checkoutDialog.querySelector("input").focus();
    });
    document.querySelector("#close-checkout").addEventListener("click", () => checkoutDialog.close());

    checkoutDialog.addEventListener("click", event => {
        if (event.target === checkoutDialog) checkoutDialog.close();
    });

    checkoutForm.addEventListener("submit", async event => {
        event.preventDefault();
        if (cart.size === 0) return;

        if (!checkoutForm.reportValidity()) return;

        const emailConfig = window.TSHUB_EMAIL_CONFIG || {};
        const requiredConfig = [
            ["Service ID", emailConfig.serviceId],
            ["Template ID", emailConfig.templateId],
            ["Public Key", emailConfig.publicKey]
        ];
        const missingConfig = requiredConfig
            .filter(([, value]) => typeof value !== "string" || !value.trim() || value.trim().startsWith("YOUR_EMAILJS_"))
            .map(([label]) => label);

        if (missingConfig.length > 0) {
            emailStatus.textContent = `Email confirmation is not configured. Add your actual ${missingConfig.join(", ")} in email-config.js.`;
            return;
        }

        if (!window.emailjs || typeof window.emailjs.send !== "function") {
            emailStatus.textContent = "Email service could not load. Check your internet connection and reload the page.";
            return;
        }

        const formData = new FormData(checkoutForm);
        const { subtotalAmount, shippingAmount, amount } = getCartTotals();
        const orderDate = new Date();
        const datePart = [orderDate.getFullYear(), String(orderDate.getMonth() + 1).padStart(2, "0"), String(orderDate.getDate()).padStart(2, "0")].join("");
        const orderNumber = `TS-${datePart}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const items = [...cart.values()].map(item => ({
            name: item.name,
            brand: item.brand,
            size: item.size,
            quantity: item.quantity,
            unit_price: formatPrice(item.price),
            line_total: formatPrice(item.price * item.quantity)
        }));
        const templateParams = {
            to_email: String(formData.get("email")).trim(),
            customer_name: String(formData.get("name")).trim(),
            order_number: orderNumber,
            order_date: new Intl.DateTimeFormat("en-ZA", {
                dateStyle: "long",
                timeStyle: "short"
            }).format(orderDate),
            payment_method: String(formData.get("payment_method")).trim(),
            payment_status: "DEMO ONLY - no payment accepted",
            items,
            subtotal_amount: formatPrice(subtotalAmount),
            shipping_amount: formatPrice(shippingAmount),
            total_amount: formatPrice(amount),
            phone: String(formData.get("phone")).trim(),
            delivery_address: String(formData.get("address")).trim()
        };

        placeOrderButton.disabled = true;
        placeOrderButton.textContent = "Sending confirmation...";
        emailStatus.textContent = "Sending your order confirmation...";

        try {
            await window.emailjs.send(
                emailConfig.serviceId,
                emailConfig.templateId,
                templateParams,
                { publicKey: emailConfig.publicKey }
            );

            cart.clear();
            saveCart();
            renderCart();
            checkoutForm.reset();
            emailStatus.textContent = `Demo order request ${orderNumber} was submitted. Confirmation sent to ${templateParams.to_email}. No payment was collected; the displayed EFT details are not payable.`;
            placeOrderButton.textContent = "Confirmation sent";
        } catch (error) {
            console.error("EmailJS order confirmation failed:", error);
            const errorDetails = error && typeof error === "object"
                ? (typeof error.text === "string" ? error.text : typeof error.message === "string" ? error.message : "")
                : typeof error === "string" ? error : "";
            const errorStatus = error && typeof error === "object" && typeof error.status === "number"
                ? ` (HTTP ${error.status})`
                : "";
            const errorMessage = errorDetails ? ` EmailJS: ${errorDetails.slice(0, 300)}` : "";
            emailStatus.textContent = `We could not send the confirmation${errorStatus}.${errorMessage} Your cart is saved; check the EmailJS settings and try again.`;
            placeOrderButton.disabled = false;
            placeOrderButton.textContent = "Try again";
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && cartPanel.classList.contains("is-open")) closeCart();
    });

    loadCart();
    renderCart();
})();