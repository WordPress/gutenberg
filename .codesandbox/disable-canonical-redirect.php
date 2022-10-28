<?php
/**
 * Plugin Name: Disables the WP canonical redirect
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-codesandbox-disabled-canonical-redirect
 */

remove_filter( 'template_redirect', 'redirect_canonical' );
