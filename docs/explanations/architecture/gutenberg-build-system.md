# Gutenberg Build System: Function Prefixing and Block Loading

## High-Level Overview

Gutenberg uses a sophisticated build system that automatically transforms PHP function names to avoid conflicts with WordPress Core. This system allows Gutenberg to use standard WordPress function names in source code while ensuring the plugin can coexist with WordPress Core without naming collisions.

**Key Concept**: Source files use standard WordPress function names (e.g., `block_core_navigation_link_build_css_colors`), but the build system transforms them to prefixed versions (e.g., `gutenberg_block_core_navigation_link_build_css_colors`) in the built files that are actually loaded at runtime.

## How the System Works

### 1. Source Code Structure

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

### 2. Build Configuration

The build system is configured in `packages/block-library/package.json`:

```json
{
	"wpCopyFiles": {
		"files": [ "src/**/*.php", "src/*/block.json" ],
		"transforms": {
			"php": {
				"functionPrefix": "gutenberg_",
				"classSuffix": "_Gutenberg",
				"prefixFunctions": [
					"wp_apply_colors_support",
					"wp_enqueue_block_support_styles",
					"wp_get_typography_font_size_value",
					"wp_style_engine_get_styles",
					"wp_get_global_settings"
				],
				"suffixClasses": [ "WP_Navigation_Block_Renderer" ],
				"addActionPriority": 20,
				"flattenIndexFiles": true
			}
		}
	}
}
```

### 3. Build Process

The build system (webpack + custom transforms) performs these operations:

#### Function Prefixing

```php
// Source (packages/block-library/src/navigation-link/index.php)
function block_core_navigation_link_build_css_colors( $context, $attributes, $is_sub_menu = false ) {
    // function body
}

// Built (build/block-library/navigation-link.php)
function gutenberg_block_core_navigation_link_build_css_colors( $context, $attributes, $is_sub_menu = false ) {
    // function body
}
```

#### Function Call Updates

```php
// Source
$font_size = wp_get_typography_font_size_value( $args );

// Built
$font_size = gutenberg_get_typography_font_size_value( $args );
```

#### Class Suffixing

```php
// Source
class WP_Style_Engine { }

// Built
class WP_Style_Engine_Gutenberg { }
```

### 4. Built File Locations

The build system creates transformed files in multiple locations:

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

### 5. Runtime Loading

The `lib/blocks.php` file loads built blocks in priority order:

```php
$blocks_dirs = array(
    __DIR__ . '/../build/scripts/block-library/',    // First priority
    __DIR__ . '/../build/scripts/edit-widgets/blocks/',
    __DIR__ . '/../build/scripts/widgets/blocks/',
);
```

## Why This System is Necessary

### 1. **Avoiding Function Name Conflicts**

WordPress Core and Gutenberg plugin can coexist without conflicts:

```php
// WordPress Core (future)
function block_core_navigation_link_build_css_colors() { }

// Gutenberg Plugin (current)
function gutenberg_block_core_navigation_link_build_css_colors() { }
```

### 2. **Backport Compatibility**

When functions are backported to WordPress Core, Gutenberg can continue using its prefixed versions:

```php
// Gutenberg continues to work
gutenberg_block_core_navigation_link_build_css_colors()

// Core version becomes available
block_core_navigation_link_build_css_colors()
```

### 3. **Plugin Independence**

Gutenberg can evolve independently of WordPress Core release cycles:

-   New features can be added to Gutenberg immediately
-   Functions can be refined in Gutenberg before Core adoption
-   Experimental features can be tested in Gutenberg first

### 4. **Testing Isolation**

Tests can target specific function versions:

```php
// Test the Gutenberg version
gutenberg_block_core_post_time_to_read_word_count()

// Test the Core version (when available)
block_core_post_time_to_read_word_count()
```

## How to Work With This System

### 1. **Writing Source Code**

Use standard WordPress function names in source files:

```php
// packages/block-library/src/my-block/index.php
function block_core_my_block_render_function( $attributes, $content, $block ) {
    // Your code here
}

function render_block_core_my_block( $attributes, $content, $block ) {
    return block_core_my_block_render_function( $attributes, $content, $block );
}
```

### 2. **Function Naming Conventions**

Follow WordPress Core naming patterns:

```php
// Block-specific functions
block_core_[block_name]_[function_name]()

// Render functions
render_block_core_[block_name]()

// Register functions
register_block_core_[block_name]()
```

### 3. **Testing Built Functions**

Always test the built (prefixed) versions:

```php
// phpunit/blocks/my-block-test.php
class My_Block_Test extends WP_UnitTestCase {
    public function test_my_function() {
        // Test the built function (with gutenberg_ prefix)
        $result = gutenberg_block_core_my_block_render_function( $args );
        $this->assertEquals( $expected, $result );
    }
}
```

### 4. **Debugging Build Issues**

If functions aren't being prefixed correctly:

1. **Check build configuration** in `package.json`
2. **Verify function names** match the patterns in `prefixFunctions`
3. **Run build process** to regenerate files
4. **Check built files** in `build/` directory

### 5. **Adding New Functions to Prefix List**

To add functions to the automatic prefixing list:

```json
// packages/block-library/package.json
{
	"wpCopyFiles": {
		"transforms": {
			"php": {
				"prefixFunctions": [
					"wp_apply_colors_support",
					"wp_enqueue_block_support_styles",
					"wp_get_typography_font_size_value",
					"wp_style_engine_get_styles",
					"wp_get_global_settings",
					"wp_my_new_function" // Add your function here
				]
			}
		}
	}
}
```

### 6. **Understanding Function Resolution**

The system loads functions in this order:

1. **Built Gutenberg functions** (prefixed)
2. **WordPress Core functions** (if available)
3. **Plugin functions** (if any)

This ensures Gutenberg functions take precedence over Core equivalents.

## Common Patterns and Examples

### Example 1: Block Rendering Function

```php
// Source: packages/block-library/src/example/index.php
function block_core_example_render( $attributes, $content, $block ) {
    return '<div class="example">' . $content . '</div>';
}

function render_block_core_example( $attributes, $content, $block ) {
    return block_core_example_render( $attributes, $content, $block );
}

// Built: build/block-library/example.php
function gutenberg_block_core_example_render( $attributes, $content, $block ) {
    return '<div class="example">' . $content . '</div>';
}

function gutenberg_render_block_core_example( $attributes, $content, $block ) {
    return gutenberg_block_core_example_render( $attributes, $content, $block );
}
```

### Example 2: Utility Function

```php
// Source
function block_core_example_utility_function( $input ) {
    return wp_kses_post( $input );
}

// Built
function gutenberg_block_core_example_utility_function( $input ) {
    return gutenberg_wp_kses_post( $input );  // wp_kses_post also gets prefixed
}
```

### Example 3: Class Definition

```php
// Source
class WP_Example_Block_Handler {
    public function process() {
        // class body
    }
}

// Built
class WP_Example_Block_Handler_Gutenberg {
    public function process() {
        // class body
    }
}
```

## Troubleshooting

### Issue: Function Not Found

**Problem**: `Fatal error: Call to undefined function gutenberg_block_core_my_function()`

**Solution**:

1. Check if the function exists in the built file
2. Verify the build process completed successfully
3. Ensure the function is being loaded by `lib/blocks.php`

### Issue: Double Prefixing

**Problem**: Function becomes `gutenberg_gutenberg_my_function()`

**Solution**:

1. Check if the source function already has `gutenberg_` prefix
2. Remove the prefix from the source function
3. Let the build system add the prefix automatically

### Issue: Tests Failing

**Problem**: Tests can't find the function being tested

**Solution**:

1. Ensure tests are calling the prefixed function name
2. Verify the built file contains the function
3. Check that the test environment loads the built files

## Best Practices

1. **Always use standard WordPress function names** in source code
2. **Test the built (prefixed) functions**, not the source functions
3. **Don't manually add `gutenberg_` prefixes** in source code
4. **Use the build system** to handle all transformations
5. **Document which functions are prefixed** for team members
6. **Keep source code clean** and let the build system handle the complexity

This system ensures Gutenberg can evolve independently while maintaining compatibility with WordPress Core, providing a robust foundation for the block editor's continued development.
