<?php
/**
 * Loads the WordPress stubs generated from core trunk, or from a core pull request that a change
 * depends on.
 *
 * The szepeviktor/phpstan-wordpress extension loads this file as a bootstrap file, from where the
 * php-stubs/wordpress-stubs package would install it. The path repository symlinks it there, so that
 * this finds the stubs, which are generated in this directory and not committed. They have the .stub
 * extension, so that they are not mistaken for code that runs.
 *
 * @see generate-wordpress-stubs.php
 */

if ( ! file_exists( __DIR__ . '/wordpress-stubs.stub' ) ) {
	throw new RuntimeException( 'The WordPress stubs have not been generated. Run `composer phpstan`, which generates them first, or `composer phpstan:generate-wordpress-stubs`.' );
}

require __DIR__ . '/wordpress-stubs.stub';
