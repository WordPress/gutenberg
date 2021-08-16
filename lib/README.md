# PHP directory structure

- `lib/legacy` - Legacy code, for compatibility with previous plugin versions.
- `lib/experimental` - Features considered experimental. They may or may not end up in Core one day.
- `lib/stable` - Features considered stable. They will end up in Core one day.
- `lib/compat/X.X` - Implements functionality that was added to Core in X.X. Can be removed once the plugin requires X.X as a minimum.

# Best practices

- Group PHP code by feature, e.g. prefer navigation.php to client-assets.php
- Call add_action / add_filter near to the function definition.
- Wrap functions with if ( ! function_exists( '' ) ) { }.
- Return early in class declarations if ( class_exists( '' ) ) { }.
