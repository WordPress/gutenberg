# PHP, REST, schema, and security

Use this reference for `lib/`, REST controllers and routes, schemas,
permissions, sanitization, escaping, and compatibility shims.

## Compatibility and loading

- Put new compatibility code in the applicable
  `lib/compat/wordpress-X.Y/` directory and register required version layers in
  `lib/load.php`.
- Guard fallback definitions with direct capability checks when functions or
  classes may already exist.
- For Gutenberg-to-Core synchronization, identify all eligible PHP files. Keep
  direct-sync files byte-identical and port only relevant changes from
  versioned shims to their Core destinations.

## REST contracts

- Register routes with action-specific `permission_callback`s. Resolve the
  requested resource before capability checks and recheck immediately before a
  sensitive side effect.
- Derive endpoint arguments from the item schema where applicable; prepare
  responses through the controller contract; honor requested fields and
  contexts; test schema and dispatched response together.
- When fields change, keep route arguments, server item schema, prepared
  responses, `_fields` behavior, contexts, and client consumers aligned.
- A custom `validate_callback` replaces default argument validation. Explicitly
  retain the schema's type/format validation when adding custom checks.
- For structured configuration, define exact types, bounds, patterns, enums,
  and nested schemas. Set `additionalProperties: false` when unknown keys are
  unsupported; sanitize the decoded container against the schema before
  applying field-specific sanitization.
- Verify an unauthorized representative role is rejected before any protected
  side effect.

## Input and output safety

- Validate caller-supplied remote media URLs with REST schema validation and
  `wp_http_validate_url()`. Reject unsupported filenames before download, use
  WordPress download helpers, and propagate failures without creating partial
  attachments.
- Build UI with WordPress Element instead of raw HTML when practical. In PHP,
  escape text, attributes, and URLs for their final sink; use `wp_kses_post()`
  only when safe HTML is intentionally allowed.
- Process dynamic CSS declarations with `safecss_filter_attr()`, narrowly
  allowlist any extensions, then escape for the final HTML attribute context.
  Test unsafe properties and markup-bearing values.
- Authorize REST responses, declare permitted field contexts, honor requested
  fields, and filter assembled data by request context before returning it.
