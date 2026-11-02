# EmailJS order confirmation setup

This storefront uses the existing checkout form. After the customer submits a valid order and EmailJS accepts the email request, the customer receives an order confirmation. The cart is cleared only after EmailJS reports success. If sending fails, the cart stays saved so the customer can retry.

## 1. Create an EmailJS service

1. Sign in at [EmailJS](https://dashboard.emailjs.com/).
2. Open **Email Services**, add/connect your email provider, and copy its **Service ID**.
3. Open **Account > General** and copy your **Public Key**. This is designed for browser use. Do not put an EmailJS private key or email account password in this project.

## 2. Create the order template

1. Open **Email Templates** and create a template. Copy its **Template ID**.
2. Set **To Email** to `{{to_email}}`.
3. Set **Subject** to `TS HUB SA order confirmation - {{order_number}}`.
4. Open the template's HTML/code editor and paste the contents of `emailjs-order-template.html`.
5. In the template's attachment settings, add a **static attachment** named exactly `logo.png`. Use the existing `LOGO.png` file. The template uses `cid:logo.png`, so the logo is embedded and works even when the site is running on localhost.
6. To receive a copy of every order, set the template's **BCC** field to `hello.tshubsa@gmail.com`.
7. Save the template and use EmailJS's **Test It** tool to check email delivery.

The template expects these variables: `to_email`, `customer_name`, `order_number`, `order_date`, `payment_status`, `payment_method`, `items` (name, brand, size, quantity, unit_price, line_total), `subtotal_amount`, `shipping_amount`, and `total_amount`. Prices are formatted in South African rand (R), and shipping is a flat R200 per order. The checkout also sends `phone` and `delivery_address` if you want to add them to the template.

## 3. Add the IDs to the project

The Service ID and Template ID from your EmailJS screenshots are configured in `email-config.js`. Add your **Public Key** to the remaining placeholder:

```js
window.TSHUB_EMAIL_CONFIG = {
    serviceId: "hello.tshubsa@2",
    templateId: "template_01n6d1o",
    publicKey: "YMUcJtPpzUUZR6BjC"
};
```

The EmailJS public key is intended for browser use. Keep private keys and provider passwords out of `email-config.js` and all other frontend files. The EmailJS template's **BCC** field must be set to `hello.tshubsa@gmail.com` if you want to receive a copy of each order. The checkout sends the confirmation to the customer email entered in the form.

## Troubleshooting send failures

If checkout fails, the page displays the HTTP status and error returned by EmailJS, and keeps the cart so you can retry after fixing the setting.

- **Service ID not found:** In **Email Services**, open the connected Gmail service and copy its exact **Service ID** into `email-config.js`. Do not use the service name or Gmail address unless that is exactly what EmailJS labels as the Service ID.
- **Template ID not found:** In **Email Templates > Order Confirmation > Settings**, copy the exact Template ID. The current configured value is `template_mynth44`.
- **Missing template parameter or recipient error:** Set the template's **To Email** to `{{to_email}}` and save it. The template must use the variables listed above.
- **Unauthorized, origin, or rate-limit error:** Check the EmailJS account's allowed origins/security settings, confirm the public key is current, and check the account's request limit.

You can also use EmailJS's **Test It** button to validate the service and template independently of the website checkout.

## 4. Test locally

1. Keep `website.html`, `store.js`, `email-config.js`, `emailjs-order-template.html`, `style.css`, and the image files together in the project folder.
2. Start a local web server from that folder (for example, in VS Code use the Live Server extension and open `website.html`). A local server at `http://localhost` does not require hosting or a domain. Internet access is needed for the EmailJS browser SDK and sending emails.
3. Add a product to the cart, open the cart, choose **Checkout**, and enter an email address you can access.
4. Click **Place Order**. On success, the page displays the order number and confirms the destination email. Check the recipient inbox and spam folder.
5. To test failure handling, temporarily enter an incorrect Service ID. The page should show an error and keep the cart so you can correct the configuration and retry.

## Payment after ordering

Checkout currently displays a **demo-only** EFT section with the placeholder number `123456789`. The amount is calculated from the cart total, but it is not payable. Replace the placeholder with verified TS HUB SA business bank details before accepting real payments. This static website does not collect or verify payment; an order request is not proof of payment. Do not mark an order **Paid** until a transfer has been verified.

EmailJS can send from localhost, but its public key and template are visible to website visitors. Restrict allowed origins in EmailJS where possible, enable its anti-abuse protections, and review its sending limits before using the site publicly.