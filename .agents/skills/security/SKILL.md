---
name: security
description: Use when writing or reviewing code that prints data into HTML (PHP render callbacks, server-rendered markup, `RawHTML`, `dangerouslySetInnerHTML`, `innerHTML`), builds a link from data, or accepts input through a REST route, form or admin handler.
---

# Security

Escape output at the point you print it, sanitize and validate input where it arrives, and check permissions before acting. Read [Escaping Data](https://developer.wordpress.org/apis/security/escaping/) for the full list of functions.

No linter checks this for you: `phpcs.xml.dist` uses the `WordPress-Core` ruleset, which has no `WordPress.Security` sniffs, and the ESLint config has no rule against `dangerouslySetInnerHTML`. Check each output by hand.

## PHP output

-   Escape for the context you print into: `esc_html()` for text, `esc_attr()` for attribute values, `esc_url()` for `href` and `src`, `wp_kses_post()` for HTML that must keep its markup. Translated strings too: `esc_html__()`, `esc_attr__()`.
-   In a render callback, every block attribute, post meta value, option and `theme.json` value is untrusted, however numeric or preset-like it looks.
-   `WP_HTML_Tag_Processor::set_attribute()` escapes the value itself, and passes URL attributes through `esc_url()`. Do not escape it again. Anything you concatenate into the HTML string still needs escaping.

## JavaScript output

-   React escapes text children and attribute values. `RawHTML`, `dangerouslySetInnerHTML` and `innerHTML` do not: pass them only HTML the server already sanitized or HTML built from constants.
-   `safeHTML` from `@wordpress/dom` removes `<script>` elements and `on*` attributes and nothing else. It is not a sanitizer for untrusted HTML.
-   React 19 neutralises a `javascript:` URL in the browser, but block `save()` markup is serialized by `@wordpress/element`, which escapes attributes and does not check protocols. Parse a URL from data with `new URL()` and allow only the protocols you expect. `isValidProtocol` from `@wordpress/url` checks syntax only and accepts `javascript:`.

## Input and permissions

-   Sanitize with the function for the type (`sanitize_text_field()`, `absint()`, `sanitize_key()`), then validate against what you expect. See [Sanitizing Data](https://developer.wordpress.org/apis/security/sanitizing/) and [Data Validation](https://developer.wordpress.org/apis/security/data-validation/).
-   A REST route declares its input in the `args` schema and checks a capability with `current_user_can()` in `permission_callback`. Use `__return_true` only for a route that is public by design.
-   A form or admin handler checks a [nonce](https://developer.wordpress.org/apis/security/nonces/) as well as a capability. A nonce proves intent, not permission.
