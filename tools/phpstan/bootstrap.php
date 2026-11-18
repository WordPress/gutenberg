<?php
/**
 * Defines WordPress constants which are not available in the stubs, for discovery.
 */

const WPINC                               = 'wp-includes';
const MEDIA_TRASH                         = false;
const WP_TEMPLATE_PART_AREA_UNCATEGORIZED = 'uncategorized';

// Defined by the WordPress test bootstrap, for a local configuration that adds phpunit to the paths.
const DIR_TESTDATA    = '/tmp/wordpress-tests-lib/data';
const WP_TESTS_DOMAIN = 'example.org';
