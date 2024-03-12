<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_enqueue_block_view_script' ) ) {
	/**
	 * Enqueues a frontend script for a specific block.
	 *
	 * Scripts enqueued using this function will only get printed
	 * when the block gets rendered on the frontend.
	 *
	 * @since 6.2.0
	 *
	 * @param string $block_name The block name, including namespace.
	 * @param array  $args       An array of arguments [handle,src,deps,ver,media,textdomain].
	 *
	 * @return void
	 */
	function wp_enqueue_block_view_script( $block_name, $args ) {
		$args = wp_parse_args(
			$args,
			array(
				'handle'     => '',
				'src'        => '',
				'deps'       => array(),
				'ver'        => false,
				'in_footer'  => false,

				// Additional args to allow translations for the script's textdomain.
				'textdomain' => '',
			)
		);

		/**
		 * Callback function to register and enqueue scripts.
		 *
		 * @param string $content When the callback is used for the render_block filter,
		 *                        the content needs to be returned so the function parameter
		 *                        is to ensure the content exists.
		 * @return string Block content.
		 */
		$callback = static function ( $content, $block ) use ( $args, $block_name ) {

			// Sanity check.
			if ( empty( $block['blockName'] ) || $block_name !== $block['blockName'] ) {
				return $content;
			}

			// Register the stylesheet.
			if ( ! empty( $args['src'] ) ) {
				wp_register_script( $args['handle'], $args['src'], $args['deps'], $args['ver'], $args['in_footer'] );
			}

			// Enqueue the stylesheet.
			wp_enqueue_script( $args['handle'] );

			// If a textdomain is defined, use it to set the script translations.
			if ( ! empty( $args['textdomain'] ) && in_array( 'wp-i18n', $args['deps'], true ) ) {
				wp_set_script_translations( $args['handle'], $args['textdomain'], $args['domainpath'] );
			}

			return $content;
		};

		/*
		 * The filter's callback here is an anonymous function because
		 * using a named function in this case is not possible.
		 *
		 * The function cannot be unhooked, however, users are still able
		 * to dequeue the script registered/enqueued by the callback
		 * which is why in this case, using an anonymous function
		 * was deemed acceptable.
		 */
		add_filter( 'render_block', $callback, 10, 2 );
	}
}

function add_navigation_overlay_area( $areas ) {
	$areas[] = array(
		'area'        => 'navigation-overlay',
		'label'       => _x( 'Navigation Overlay', 'template part area' ),
		'description' => __(
			'An area for navigation overlay content.'
		),
		'area_tag'    => 'section',
		'icon'        => 'handle',
	);
	return $areas;
}
add_filter( 'default_wp_template_part_areas', 'add_navigation_overlay_area', 10, 1 );

function add_default_navigation_overlay_template_part( $block_template, $id, $template_type ) {

	// if the template type is not template part, return the block template
	if ( 'wp_template_part' !== $template_type ) {
		return $block_template;
	}

	// If its not the "Core" Navigation Overlay, return the block template.
	if ( $id !== 'core//navigation-overlay' ) {
		return $block_template;
	}

	// If the block template is not empty, return the "found" block template.
	// Failure to do this will override any "found" overlay template part from the Theme.
	if ( ! empty( $block_template ) ) {
		return $block_template;
	}

	// Return a default template part for the Navigation Overlay.
	// This is essentially a "Core" fallback in case the Theme does not provide one.
	$template = new WP_Block_Template();

	// TODO: should we provide "$theme" here at all as this is a "Core" template.
	$template->id             = 'core' . '//' . 'navigation-overlay';
	$template->theme          = 'core';
	$template->slug           = 'navigation-overlay';
	$template->source         = 'custom';
	$template->type           = 'wp_template_part';
	$template->title          = 'Navigation Overlay';
	$template->status         = 'publish';
	$template->has_theme_file = null;
	$template->is_custom      = false;
	$template->modified       = null;
	$template->origin         = null;
	$template->author         = null;

	// Set the area to match the Navigation Overlay area.
	$template->area = 'navigation-overlay';

	// The content is the default Navigation Overlay template part. This will only be used
	// if the Theme does not provide a template part for the Navigation Overlay.
	// PHP is used here to allow for translation of the default template part.
	ob_start();
	include __DIR__ . '/navigation-overlay.php';
	$template->content = ob_get_clean();

	return $template;
}

add_filter( 'get_block_file_template', 'add_default_navigation_overlay_template_part', 10, 3 );
