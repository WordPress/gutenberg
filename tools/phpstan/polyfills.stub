<?php
/**
 * Declares the polyfills that WordPress provides in wp-includes/compat.php, for discovery.
 *
 * The WordPress stubs omit these, since they are defined conditionally, and with `phpVersion`
 * starting at PHP 7.4, PHPStan otherwise reports the newer PHP functions as not found.
 *
 * Only the polyfills available in the minimum supported WordPress version (7.0) are declared,
 * so that relying on a newer one is still reported. Those added in WordPress 7.1, `mb_chr()`,
 * `mb_ord()`, and `clamp()`, are therefore omitted.
 *
 * This file is only scanned, never executed.
 */

/**
 * Polyfill for `str_contains()`, added in PHP 8.0 and polyfilled since WordPress 5.9.
 */
function str_contains( string $haystack, string $needle ): bool {}

/**
 * Polyfill for `str_starts_with()`, added in PHP 8.0 and polyfilled since WordPress 5.9.
 */
function str_starts_with( string $haystack, string $needle ): bool {}

/**
 * Polyfill for `str_ends_with()`, added in PHP 8.0 and polyfilled since WordPress 5.9.
 */
function str_ends_with( string $haystack, string $needle ): bool {}

/**
 * Polyfill for `array_is_list()`, added in PHP 8.1 and polyfilled since WordPress 6.5.
 *
 * @param array<mixed> $array
 */
function array_is_list( array $array ): bool {}

/**
 * Polyfill for `array_find()`, added in PHP 8.4 and polyfilled since WordPress 6.8.
 *
 * @template TKey of array-key
 * @template TValue
 *
 * @param array<TKey, TValue>          $array
 * @param callable(TValue, TKey): bool $callback
 * @return TValue|null
 */
function array_find( array $array, callable $callback ) {}

/**
 * Polyfill for `array_find_key()`, added in PHP 8.4 and polyfilled since WordPress 6.8.
 *
 * @template TKey of array-key
 * @template TValue
 *
 * @param array<TKey, TValue>          $array
 * @param callable(TValue, TKey): bool $callback
 * @return TKey|null
 */
function array_find_key( array $array, callable $callback ) {}

/**
 * Polyfill for `array_any()`, added in PHP 8.4 and polyfilled since WordPress 6.8.
 *
 * @template TKey of array-key
 * @template TValue
 *
 * @param array<TKey, TValue>          $array
 * @param callable(TValue, TKey): bool $callback
 */
function array_any( array $array, callable $callback ): bool {}

/**
 * Polyfill for `array_all()`, added in PHP 8.4 and polyfilled since WordPress 6.8.
 *
 * @template TKey of array-key
 * @template TValue
 *
 * @param array<TKey, TValue>          $array
 * @param callable(TValue, TKey): bool $callback
 */
function array_all( array $array, callable $callback ): bool {}

/**
 * Polyfill for `array_first()`, added in PHP 8.5 and polyfilled since WordPress 6.9.
 *
 * @template TValue
 *
 * @param array<TValue> $array
 * @return TValue|null
 */
function array_first( array $array ) {}

/**
 * Polyfill for `array_last()`, added in PHP 8.5 and polyfilled since WordPress 6.9.
 *
 * @template TValue
 *
 * @param array<TValue> $array
 * @return TValue|null
 */
function array_last( array $array ) {}
