<?php
/**
 * Plugin Name: Gutenberg Test Suggestion Final Status Seed
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Lets a REST client write a final suggestion status, so an e2e test can seed
 * a note in the state an editor from before the save pass left it in: final,
 * with its marker still in the post.
 *
 * @package gutenberg-test-suggestion-final-status-seed
 */

add_filter( 'gutenberg_allow_client_final_suggestion_status', '__return_true' );
