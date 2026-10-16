---
name: security
description: Use when writing or reviewing PHP that prints data into HTML (render callbacks, server-rendered markup), accepts input, or exposes data through a REST route or other API.
---

# Security

Escape output at the point you print it, sanitize and validate input where it arrives, and check permissions before acting. Read [Escaping Data](https://developer.wordpress.org/apis/security/escaping/) for the full list of functions.

## PHP output

-   Escape for the context you print into: `esc_html()` for text, `esc_attr()` for attribute values, `esc_url()` for `href` and `src`, `wp_kses_post()` for HTML that must keep its markup. Translated strings too: `esc_html__()`, `esc_attr__()`.
-   In a render callback, every block attribute, post meta value, option and `theme.json` value is untrusted, however numeric or preset-like it looks.
-   `WP_HTML_Tag_Processor::set_attribute()` escapes the value itself, and passes URL attributes through `esc_url()`. Do not escape it again. Anything you concatenate into the HTML string still needs escaping.
-   CSS built from data is output too: pass declarations through `safecss_filter_attr()` before printing them in a `style` attribute.

## Input and permissions

-   Sanitize with the function for the type (`sanitize_text_field()`, `absint()`, `sanitize_key()`), then validate against what you expect. See [Sanitizing Data](https://developer.wordpress.org/apis/security/sanitizing/) and [Data Validation](https://developer.wordpress.org/apis/security/data-validation/).
-   Before building a file path from input, reject traversal with `validate_file()` (any non-zero result means reject) and join the value to a known directory. `validate_file()` returns `0` for an absolute path, so it does not confine the path on its own.
-   Design every API around who may read and who may change its data, and enforce that on the server. Check capabilities with `current_user_can()` (in a REST route, from its `permission_callback`), prefer an object-level check such as `current_user_can( 'edit_post', $post_id )` over a blanket `edit_posts`, and return only data the caller is allowed to see. See [Roles and Capabilities](https://developer.wordpress.org/apis/security/user-roles-and-capabilities/).
