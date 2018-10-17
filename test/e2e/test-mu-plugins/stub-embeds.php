<?php

/**
 * Plugin Name: Gutenberg Test Plugin, Stub Embeds
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-stub-embeds
 */

/*
 * NOTE: Currently, this only overrides the `html` return value of the embed
 * request, but does not (yet) otherwise stub the request to the provider's
 * oEmbed endpoint.
 */

add_filter( 'pre_oembed_result', '__return_empty_string' );
