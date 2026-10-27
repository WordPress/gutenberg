<?php
/**
 * Loads the WordPress stubs generated from core trunk, or from a core pull request that a change
 * depends on.
 *
 * The szepeviktor/phpstan-wordpress extension loads this file as a bootstrap file, from where the
 * php-stubs/wordpress-stubs package would install it. The stubs themselves have the .stub
 * extension, so that they are not mistaken for code that runs.
 *
 * @see generate-wordpress-stubs.sh
 */

require __DIR__ . '/wordpress-stubs.stub';
