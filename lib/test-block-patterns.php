<?php
/**
 * Block patterns registration.
 *
 * @package gutenberg
 */

// Test patterns for transform scope. This file will be deleted before merge.

// Single block pattens with different attributes.
// Paragraph patterns.
register_block_pattern(
	'paragraph/v1',
	array(
		'title'      => __( 'Paragraph version 1', 'gutenberg' ),
		'blockTypes' => array( 'core/paragraph' ),
		'content'    => '<!-- wp:paragraph {"dropCap":true,"backgroundColor":"orange"} -->
						<p class="has-drop-cap has-orange-background-color has-background">Hello my paragraph!</p>
						<!-- /wp:paragraph -->',
	)
);
register_block_pattern(
	'paragraph/v2',
	array(
		'title'      => __( 'Paragraph version 2', 'gutenberg' ),
		'blockTypes' => array( 'core/paragraph' ),
		'content'    => '<!-- wp:paragraph {"align":"center","backgroundColor":"gray","textColor":"green","fontSize":"extra-large"} -->
						<p class="has-text-align-center has-green-color has-gray-background-color has-text-color has-background has-extra-large-font-size">Hello my paragraph!</p>
						<!-- /wp:paragraph -->',
	)
);

// Multi block transform patterns.
register_block_pattern(
	'multi/v2',
	array(
		'title'      => __( 'Multi blocks v2 - deep nesting', 'gutenberg' ),
		'blockTypes' => array( 'core/paragraph', 'core/heading' ),
		'content'    => '<!-- wp:group -->
						<div class="wp-block-group"><div class="wp-block-group__inner-container">
						<!-- wp:heading {"fontSize":"large"} -->
						<h2 class="has-large-font-size"><span style="color:#ba0c49" class="has-inline-color"><strong>2</strong>.</span>Which treats of the first sally the ingenious Don Quixote made from home</h2>
						<!-- /wp:heading -->
						<!-- wp:group -->
						<div class="wp-block-group"><div class="wp-block-group__inner-container">
						<!-- wp:paragraph -->
						<p>These preliminaries settled, he did not care to put off any longer the execution of his design, urged on to it by the thought of all the world was losing by his delay, seeing what wrongs he intended to right, grievances to redress, injustices to repair, abuses to remove, and duties to discharge.</p>
						<!-- /wp:paragraph -->
						</div></div>
						<!-- /wp:group -->
						<!-- wp:heading {"backgroundColor":"purple"} -->
						<h2 class="has-purple-background-color has-background">Pattern Heading</h2>
						<!-- /wp:heading -->
						</div></div>
						<!-- /wp:group -->',
	)
);
register_block_pattern(
	'multi/v1',
	array(
		'title'      => __( 'Multi blocks v1', 'gutenberg' ),
		'blockTypes' => array( 'core/paragraph', 'core/heading' ),
		'content'    => '<!-- wp:group -->
						<div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:heading {"fontSize":"large"} -->
						<h2 class="has-large-font-size"><span style="color:#ba0c49" class="has-inline-color"><strong>2</strong>.</span>Which treats of the first sally the ingenious Don Quixote made from home</h2>
						<!-- /wp:heading -->
						<!-- wp:paragraph -->
						<p>These preliminaries settled, he did not care to put off any longer the execution of his design, urged on to it by the thought of all the world was losing by his delay, seeing what wrongs he intended to right, grievances to redress, injustices to repair, abuses to remove, and duties to discharge.</p>
						<!-- /wp:paragraph --></div></div>
						<!-- /wp:group -->',
	)
);
