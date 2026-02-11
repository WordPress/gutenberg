<?php
/**
 * Demo Template Style Variations.
 *
 * This file registers sample base themes and style variations for testing
 * the template style variations feature. It's only loaded when the
 * experiment is enabled.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Registers demo base themes and style variations.
 *
 */
function gutenberg_register_demo_template_style_variations() {
	// Only register if the experiment is enabled.
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-template-style-variations' ) ) {
		return;
	}

	// Register a minimal base theme.
	gutenberg_register_base_theme(
		'demo//minimal',
		array(
			'title' => __( 'Minimal Base', 'gutenberg' ),
			'data'  => array(
				'version'  => 3,
				'settings' => array(
					'color'      => array(
						'palette' => array(
							array(
								'slug'  => 'primary',
								'color' => '#2271b1',
								'name'  => __( 'Primary', 'gutenberg' ),
							),
							array(
								'slug'  => 'secondary',
								'color' => '#6c757d',
								'name'  => __( 'Secondary', 'gutenberg' ),
							),
							array(
								'slug'  => 'background',
								'color' => '#ffffff',
								'name'  => __( 'Background', 'gutenberg' ),
							),
							array(
								'slug'  => 'foreground',
								'color' => '#1a1a1a',
								'name'  => __( 'Foreground', 'gutenberg' ),
							),
						),
					),
					'typography' => array(
						'fontFamilies' => array(
							array(
								'slug'       => 'system',
								'fontFamily' => '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
								'name'       => __( 'System Font', 'gutenberg' ),
							),
						),
					),
				),
				'styles'   => array(
					'color' => array(
						'background' => '#ffffff',
						'text'       => '#1a1a1a',
					),
				),
			),
		)
	);

	// Register a dark base theme.
	// Uses very distinctive fonts (Courier New, Georgia) to make it obvious
	// when the base theme override is active.
	gutenberg_register_base_theme(
		'demo//dark-base',
		array(
			'title' => __( 'Dark Base', 'gutenberg' ),
			'data'  => array(
				'version'  => 3,
				'settings' => array(
					'color'      => array(
						'palette' => array(
							array(
								'slug'  => 'primary',
								'color' => '#60a5fa',
								'name'  => __( 'Primary', 'gutenberg' ),
							),
							array(
								'slug'  => 'secondary',
								'color' => '#94a3b8',
								'name'  => __( 'Secondary', 'gutenberg' ),
							),
							array(
								'slug'  => 'background',
								'color' => '#0f172a',
								'name'  => __( 'Background', 'gutenberg' ),
							),
							array(
								'slug'  => 'foreground',
								'color' => '#f1f5f9',
								'name'  => __( 'Foreground', 'gutenberg' ),
							),
						),
					),
					'typography' => array(
						'fontFamilies' => array(
							array(
								'slug'       => 'dark-base-mono',
								'fontFamily' => '"Courier New", Courier, monospace',
								'name'       => __( 'Dark Base Mono', 'gutenberg' ),
							),
							array(
								'slug'       => 'dark-base-serif',
								'fontFamily' => 'Georgia, "Times New Roman", Times, serif',
								'name'       => __( 'Dark Base Serif', 'gutenberg' ),
							),
						),
					),
				),
				'styles'   => array(
					'color'      => array(
						'background' => '#0f172a',
						'text'       => '#f1f5f9',
					),
					'typography' => array(
						'fontFamily' => 'Georgia, "Times New Roman", Times, serif',
					),
				),
			),
		)
	);

	// Register a dark mode style variation.
	gutenberg_register_style_variation(
		'demo//dark-mode',
		array(
			'title'      => __( 'Dark Mode', 'gutenberg' ),
			'base_theme' => 'demo//dark-base',
			'source'     => 'plugin',
			'data'       => array(
				'version' => 3,
				'styles'  => array(
					'color'    => array(
						'background' => '#1a1a1a',
						'text'       => '#f5f5f5',
					),
					'elements' => array(
						'link' => array(
							'color'  => array(
								'text' => '#93c5fd',
							),
							':hover' => array(
								'color' => array(
									'text' => '#60a5fa',
								),
							),
						),
					),
				),
			),
		)
	);

	// Register a high contrast style variation.
	gutenberg_register_style_variation(
		'demo//high-contrast',
		array(
			'title'  => __( 'High Contrast', 'gutenberg' ),
			'source' => 'plugin',
			'data'   => array(
				'version' => 3,
				'styles'  => array(
					'color'    => array(
						'background' => '#000000',
						'text'       => '#ffffff',
					),
					'elements' => array(
						'link'    => array(
							'color'  => array(
								'text' => '#ffff00',
							),
							':hover' => array(
								'color'      => array(
									'text' => '#ffffff',
								),
								'typography' => array(
									'textDecoration' => 'underline',
								),
							),
						),
						'heading' => array(
							'color' => array(
								'text' => '#ffffff',
							),
						),
					),
				),
			),
		)
	);

	// Register a warm style variation.
	gutenberg_register_style_variation(
		'demo//warm',
		array(
			'title'      => __( 'Warm Tones', 'gutenberg' ),
			'base_theme' => 'demo//minimal',
			'source'     => 'plugin',
			'data'       => array(
				'version' => 3,
				'styles'  => array(
					'color'    => array(
						'background' => '#fef7ed',
						'text'       => '#451a03',
					),
					'elements' => array(
						'link'    => array(
							'color'  => array(
								'text' => '#c2410c',
							),
							':hover' => array(
								'color' => array(
									'text' => '#9a3412',
								),
							),
						),
						'heading' => array(
							'color' => array(
								'text' => '#7c2d12',
							),
						),
					),
				),
			),
		)
	);

	// Register a cool style variation.
	gutenberg_register_style_variation(
		'demo//cool',
		array(
			'title'  => __( 'Cool Tones', 'gutenberg' ),
			'source' => 'plugin',
			'data'   => array(
				'version' => 3,
				'styles'  => array(
					'color'    => array(
						'background' => '#f0f9ff',
						'text'       => '#0c4a6e',
					),
					'elements' => array(
						'link'    => array(
							'color'  => array(
								'text' => '#0284c7',
							),
							':hover' => array(
								'color' => array(
									'text' => '#0369a1',
								),
							),
						),
						'heading' => array(
							'color' => array(
								'text' => '#075985',
							),
						),
					),
				),
			),
		)
	);
}

add_action( 'init', 'gutenberg_register_demo_template_style_variations', 20 );

/**
 * Registers a demo "Campaign Landing Page" template and assigns it a style variation.
 *
 * The template is registered via register_block_template(), and a wp_template post
 * is created so the style variation association (stored as post meta) is persisted.
 */
function gutenberg_register_demo_campaign_template() {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-template-style-variations' ) ) {
		return;
	}

	$template_content = <<<BLOCKS
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
<!-- wp:cover {"overlayColor":"primary","minHeight":400,"isDark":true} -->
<div class="wp-block-cover is-dark" style="min-height:400px"><span aria-hidden="true" class="wp-block-cover__background has-primary-background-color has-background-dim-100 has-background-dim"></span><div class="wp-block-cover__inner-container">
<!-- wp:heading {"textAlign":"center","level":1} -->
<h1 class="wp-block-heading has-text-align-center">Your Campaign Headline</h1>
<!-- /wp:heading -->
<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center">A compelling subtitle that captures the essence of your campaign.</p>
<!-- /wp:paragraph -->
</div></div>
<!-- /wp:cover -->
<!-- wp:post-content {"layout":{"type":"constrained"}} /-->
<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"},"style":{"spacing":{"margin":{"top":"var:preset|spacing|40"}}}} -->
<div class="wp-block-buttons" style="margin-top:var(--wp--preset--spacing--40)">
<!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Get Started</a></div>
<!-- /wp:button -->
</div>
<!-- /wp:buttons -->
</main>
<!-- /wp:group -->
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
BLOCKS;

	register_block_template(
		'gutenberg//campaign-landing-page',
		array(
			'title'       => __( 'Campaign Landing Page', 'gutenberg' ),
			'description' => __( 'A landing page template for marketing campaigns.', 'gutenberg' ),
			'content'     => $template_content,
			'post_types'  => array( 'page' ),
		)
	);

	// Create a wp_template post so the style variation meta can be stored.
	// The REST API reads the variation ID from post meta, which requires a post to exist.
	$existing = get_posts(
		array(
			'post_type'      => 'wp_template',
			'post_status'    => array( 'publish', 'auto-draft', 'draft' ),
			'name'           => 'campaign-landing-page',
			'posts_per_page' => 1,
			'tax_query'      => array(
				array(
					'taxonomy' => 'wp_theme',
					'field'    => 'name',
					'terms'    => get_stylesheet(),
				),
			),
		)
	);

	if ( ! empty( $existing ) ) {
		return;
	}

	$post_id = wp_insert_post(
		array(
			'post_type'    => 'wp_template',
			'post_status'  => 'publish',
			'post_title'   => __( 'Campaign Landing Page', 'gutenberg' ),
			'post_name'    => 'campaign-landing-page',
			'post_content' => $template_content,
			'meta_input'   => array(
				GUTENBERG_TEMPLATE_STYLE_VARIATION_META_KEY => 'demo//warm',
			),
		),
		true
	);

	if ( ! is_wp_error( $post_id ) ) {
		wp_set_object_terms( $post_id, get_stylesheet(), 'wp_theme' );
	}
}

add_action( 'init', 'gutenberg_register_demo_campaign_template', 21 );
