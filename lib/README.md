# Gutenberg PHP

## File structure

Gutenberg adds features to WordPress Core using PHP hooks and filters. Some
features, once considered stable and useful, are merged into Core during a Core
release. Some features remain in the plugin forever or are removed.

To make it easier for contributors to know which features need to be merged to
Core and which features can be deleted, Gutenberg uses the following file
structure for its PHP code:

- `lib/experimental` - Experimental features that exist only in the plugin. They
  are not ready to be merged to Core.
- `lib/stable` - Stable features that exist only in the plugin. They could one
  day be merged to Core, but not yet.
- `lib/compat/wordpress-X.Y` - Stable features that are intended to be merged to
  Core in the future X.Y release, or that were previously merged to Core in the
  X.Y release and remain in the plugin for backwards compatibility when running
  the plugin on older versions of WordPress.
- `lib/compat/plugin` - Features for backwards compatibility for the plugin consumers. These files don't need to be merged to Core and should have a timeline for when they should be removed from the plugin.

## Best practices

### Prefer the `wp` prefix

For features that may be merged to Core, it's best to use a `wp_` prefix for functions or a `WP_` prefix for classes.

This applies to both experimental and stable features.

Using the `wp_` prefix avoids us having to rename functions and classes from `gutenberg_` to `wp_` if the feature is merged to Core.

Functions that are intended solely for the plugin, e.g., plugin infrastructure, should use the `gutenberg_` prefix.

#### Feature that might be merged to Core

```php
function wp_get_navigation( $slug ) { ... }
```

#### Plugin infrastructure that will never be merged to Core

```php
function gutenberg_get_navigation( $slug ) { ... }
```

### Group PHP code by _feature_

Developers should organize PHP into files or folders by _feature_, not by _component_.

When defining a function that will be hooked, developers should call `add_action` and `add_filter` immediately after the function declaration.

These two practices make it easier for PHP code to start in one folder (e.g., `lib/experimental`) and eventually move to another using a simple `git mv`.

#### Good

```php
// lib/experimental/navigation.php

function wp_get_navigation( $slug ) { ... }

function wp_register_navigation_cpt() { ... }

add_action( 'init', 'wp_register_navigation_cpt' );
```

#### Not so good

```php
// lib/experimental/functions.php

function wp_get_navigation( $slug ) { ... }

// lib/experimental/post-types.php

function wp_register_navigation_cpt() { ... }

// lib/experimental/init.php
add_action( 'init', 'wp_register_navigation_cpt' );
```

### Wrap functions and classes with `! function_exists` and `! class_exists`

Developers should take care to not define functions and classes that are already defined.

When writing new functions and classes, it's good practice to use `! function_exists` and `! class_exists`.

If Core has defined a symbol once and then Gutenberg defines it a second time, fatal errors will occur.

Wrapping functions and classes avoids such errors if the feature is merged to Core.

#### Good

```php
// lib/experimental/navigation/navigation.php

if ( ! function_exists( 'wp_get_navigation' ) ) {
	function wp_get_navigation( $slug ) { ... }
}

// lib/experimental/navigation/class-wp-navigation.php

if ( class_exists( 'WP_Navigation' ) ) {
	return;
}

class WP_Navigation { ... }
```

#### Not so good

```php
// lib/experimental/navigation/navigation.php

function wp_get_navigation( $slug ) { ... }

// lib/experimental/navigation/class-gutenberg-navigation.php

class WP_Navigation { ... }
```

Furthermore, a quick codebase search will also help you know if your new method is unique.

### Note how your feature should look when merged to Core

Developers should write a brief note about how their feature should be merged to Core, for example, which Core file or function should be patched.

Notes can be included in the doc comment.

This helps future developers know what to do when merging Gutenberg features into Core.

#### Good

```php
/**
 * Returns a navigation object for the given slug.
 *
 * Should live in `wp-includes/navigation.php` when merged to Core.
 *
 * @param string $slug
 *
 * @return WP_Navigation
 */
function wp_get_navigation( $slug ) { ... }
```
