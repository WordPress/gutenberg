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
		'title'   => __( 'Paragraph version 1', 'gutenberg' ),
		'scope'   => array(
			'inserter'  => false,
			'transform' => array( 'core/paragraph' ),
		),
		'content' => '<!-- wp:paragraph {"dropCap":true,"backgroundColor":"orange"} -->
						<p class="has-drop-cap has-orange-background-color has-background">Hello my paragraph!</p>
						<!-- /wp:paragraph -->',
	)
);
register_block_pattern(
	'paragraph/v2',
	array(
		'title'   => __( 'Paragraph version 2', 'gutenberg' ),
		'scope'   => array(
			'inserter'  => false,
			'transform' => array( 'core/paragraph' ),
		),
		'content' => '<!-- wp:paragraph {"align":"center","backgroundColor":"gray","textColor":"green","fontSize":"extra-large"} -->
						<p class="has-text-align-center has-green-color has-gray-background-color has-text-color has-background has-extra-large-font-size">Hello my paragraph!</p>
						<!-- /wp:paragraph -->',
	)
);

// Multi block transform patterns.
register_block_pattern(
	'multi/v2',
	array(
		'title'   => __( 'Multi blocks v2 - deep nesting', 'gutenberg' ),
		'scope'   => array(
			'inserter'  => false,
			'transform' => array( 'core/paragraph', 'core/heading' ),
		),
		'content' => '<!-- wp:group -->
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
		'title'   => __( 'Multi blocks v1', 'gutenberg' ),
		'scope'   => array(
			'inserter'  => false,
			'transform' => array( 'core/paragraph', 'core/heading' ),
		),
		'content' => '<!-- wp:group -->
						<div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:heading {"fontSize":"large"} -->
						<h2 class="has-large-font-size"><span style="color:#ba0c49" class="has-inline-color"><strong>2</strong>.</span>Which treats of the first sally the ingenious Don Quixote made from home</h2>
						<!-- /wp:heading -->

						<!-- wp:paragraph -->
						<p>These preliminaries settled, he did not care to put off any longer the execution of his design, urged on to it by the thought of all the world was losing by his delay, seeing what wrongs he intended to right, grievances to redress, injustices to repair, abuses to remove, and duties to discharge.</p>
						<!-- /wp:paragraph --></div></div>
						<!-- /wp:group -->',
	)
);

// Template Parts Patterns.
// Headers.
register_block_pattern(
	'header/v1',
	array(
		'title'   => __( 'Header v1', 'gutenberg' ),
		'scope'   => array(
			'inserter'  => false,
			'transform' => array( 'core/template-part/header' ),
		),
		'content' => '
		<!-- wp:navigation {"orientation":"horizontal","itemsJustification":"center"} -->
		<!-- wp:page-list /-->
		<!-- /wp:navigation -->
		<!-- wp:columns {"align":"wide"} -->
		<div class="wp-block-columns alignwide">
		<!-- wp:column -->
		<div class="wp-block-column"><!-- wp:site-title /--></div>
		<!-- /wp:column -->
		<!-- wp:column -->
		<div class="wp-block-column"><!-- wp:site-tagline /--></div>
		<!-- /wp:column -->
		</div>
		<!-- /wp:columns -->',
	)
);
register_block_pattern(
	'header/v2',
	array(
		'title'   => __( 'Header v2', 'gutenberg' ),
		'scope'   => array(
			'inserter'  => false,
			'transform' => array( 'core/template-part/header' ),
		),
		'content' => '
		<!-- wp:heading {"textAlign":"center","backgroundColor":"gray","textColor":"yellow"} -->
		<h2 class="has-text-align-center has-yellow-color has-gray-background-color has-text-color has-background">This is the Header</h2>
		<!-- /wp:heading -->
		<!-- wp:columns {"align":"wide"} -->
		<div class="wp-block-columns alignwide"><!-- wp:column -->
		<div class="wp-block-column"><!-- wp:site-title /--></div>
		<!-- /wp:column -->
		<!-- wp:column -->
		<div class="wp-block-column">
		<!-- wp:site-tagline /-->
		</div>
		<!-- /wp:column --></div>
		<!-- /wp:columns -->',
	)
);
register_block_pattern(
	'footer/v1',
	array(
		'title'   => __( 'Footer v1', 'gutenberg' ),
		'scope'   => array(
			'inserter'  => false,
			'transform' => array( 'core/template-part/footer' ),
		),
		'content' => '
		<!-- wp:heading {"textAlign":"center","backgroundColor":"gray","textColor":"yellow"} -->
		<h2 class="has-text-align-center has-yellow-color has-gray-background-color has-text-color has-background">This is a Footer</h2>
		<!-- /wp:heading -->
		<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:paragraph -->
<p><a href="mailto:#">example@example.com<br></a>T. +00 (0)1 22 33 44 55</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center">2, Rue Losuis-Boilly<br>Paris, France</p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"center"} -->
<div class="wp-block-column is-vertically-aligned-center"><!-- wp:social-links {"align":"right","className":"is-style-twentytwentyone-social-icons-color"} -->
<ul class="wp-block-social-links alignright is-style-twentytwentyone-social-icons-color"><!-- wp:social-link {"url":"https://wordpress.org","service":"wordpress"} /-->

<!-- wp:social-link {"url":"https://www.facebook.com/WordPress/","service":"facebook"} /-->

<!-- wp:social-link {"url":"https://twitter.com/WordPress","service":"twitter"} /-->

<!-- wp:social-link {"url":"https://www.youtube.com/wordpress","service":"youtube"} /--></ul>
<!-- /wp:social-links --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->',
	)
);
