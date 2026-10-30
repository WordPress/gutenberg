---
name: security
description: Use when writing or reviewing PHP that prints data into HTML (render callbacks, server-rendered markup), accepts input, or exposes data through a REST route or other API.
---

# Security

Escape output at the point you print it, sanitize and validate input where it arrives, and check permissions before acting. Read [Escaping Data](https://developer.wordpress.org/apis/security/escaping/) for the full list of functions.

## PHP output

-   Escape for the context you print into: `esc_html()` for text, `esc_attr()` for attribute values, `esc_url()` for `href` and `src`, `wp_kses_post()` for HTML that must keep its markup. Translated strings too: `esc_html__()`, `esc_attr__()`.
-   In a render callback, every block attribute, post meta value, option and `theme.json` value is untrusted, however numeric or preset-like it looks. A registered attribute's schema checks its type, not its content.
-   Print `$content` (the rendered inner blocks) as is. `get_block_wrapper_attributes()` escapes the values you pass it but not the attribute names, so keep names literal.
-   `WP_HTML_Tag_Processor::set_attribute()` escapes the value and passes URL attributes through `esc_url()`. Pass the raw value: it encodes every `&`, so a pre-escaped value shows `&amp;`. It does not make an `on*` or `style` value safe.
-   `safecss_filter_attr()` drops disallowed CSS but does not escape HTML: `"><script>` passes through. Print its result with `esc_attr()` or `set_attribute()`.
-   JSON printed inside an inline `<script>` goes through `wp_json_encode()` with `JSON_HEX_TAG`.

## Input and permissions

-   Sanitize with the function for the type (`sanitize_text_field()`, `absint()`, `sanitize_key()`), then validate against what you expect. See [Sanitizing Data](https://developer.wordpress.org/apis/security/sanitizing/) and [Data Validation](https://developer.wordpress.org/apis/security/data-validation/).
-   A REST route argument with a `type` is validated and sanitized against its schema. One with no `type` and no callbacks reaches your callback raw.
-   For a file name from input, allow only the characters you expect (`sanitize_key()` or a strict pattern) and join it to a known directory. For a full path, check that its `realpath()` stays inside the base directory. `validate_file()` is not enough: it returns `0` for `..`, `foo/..` and absolute paths.
-   Design every API around who may read and who may change its data, and enforce that on the server. Check capabilities with `current_user_can()` (in a REST route, from its `permission_callback`; `__return_true` only for data logged-out visitors may read), prefer an object-level check such as `current_user_can( 'edit_post', $post_id )` over a blanket `edit_posts`, and return only data the caller is allowed to see. See [Roles and Capabilities](https://developer.wordpress.org/apis/security/user-roles-and-capabilities/).
