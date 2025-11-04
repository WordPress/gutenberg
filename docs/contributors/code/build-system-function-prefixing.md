# Build system: Function prefixing and block loading

Gutenberg uses a build system that automatically transforms PHP function names to avoid conflicts with WordPress Core. This system allows Gutenberg to use standard WordPress function names in source code while ensuring the plugin can coexist with WordPress Core without naming collisions.

## Key concept

**Source files use standard WordPress function names** (e.g., `block_core_navigation_link_build_css_colors`), but **the build system transforms them to prefixed versions** (e.g., `gutenberg_block_core_navigation_link_build_css_colors`) in the built files that are actually loaded at runtime.

## How the system works

### Source code structure

Gutenberg's source code is organized in the `packages/` directory:

```
packages/block-library/src/
├── navigation-link/
│   ├── index.php          # Source file with standard function names
│   ├── block.json
│   └── edit.js
├── post-time-to-read/
│   ├── index.php          # Source file with standard function names
│   └── block.json
└── ...
```

### Build process

The build system is configured in `packages/block-library/package.json` and transforms:

-   **Function names**: `block_core_navigation_link_build_css_colors()` → `gutenberg_block_core_navigation_link_build_css_colors()`
-   **Function calls**: `wp_get_typography_font_size_value()` → `gutenberg_get_typography_font_size_value()`
-   **Class names**: `WP_Style_Engine` → `WP_Style_Engine_Gutenberg`

### Built file locations

The build system creates transformed files in the `build/` directory:

```
build/
├── block-library/                    # Main block library
│   ├── navigation-link.php          # Prefixed functions
│   ├── post-time-to-read.php        # Prefixed functions
│   └── ...
├── scripts/block-library/            # Script-specific builds
│   ├── navigation-link.php          # Same prefixed functions
│   └── ...
└── scripts/style-engine/             # Style engine with prefixed classes
    ├── class-wp-style-engine-gutenberg.php
    └── ...
```

The `lib/blocks.php` file loads built blocks in priority order.

## Why this system is necessary

-   **Avoids function name conflicts** between WordPress Core and Gutenberg plugin
-   **Enables backport compatibility** - Gutenberg can continue using prefixed versions when functions are backported to Core
-   **Provides plugin independence** - Gutenberg can evolve independently of WordPress Core release cycles
-   **Allows testing isolation** - Tests can target specific function versions (Gutenberg vs Core)

## Testing built PHP functions

For information on how to test the built (prefixed) PHP functions, see the [Testing Prefixed Functions](/docs/contributors/code/testing-overview.md#testing-prefixed-functions) section in the testing overview documentation.

This system ensures Gutenberg can evolve independently while maintaining compatibility with WordPress Core, providing a robust foundation for the block editor's continued development.
