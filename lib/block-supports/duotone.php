<?php
/**
 * Duotone block support flag.
 *
 * @package gutenberg
 */

/**
 * Returns the prefixed id for the duotone filter for use as a CSS id.
 *
 * @param  array $preset Duotone preset value as seen in theme.json.
 * @return string        Duotone filter CSS id.
 */
function gutenberg_get_duotone_filter_id( $preset ) {
	if ( ! isset( $preset['slug'] ) ) {
		return '';
	}

	return 'wp-duotone-' . $preset['slug'];
}

/**
 * Returns the CSS filter property url to reference the rendered SVG.
 *
 * @param  array $preset Duotone preset value as seen in theme.json.
 * @return string        Duotone CSS filter property url value.
 */
function gutenberg_get_duotone_filter_property( $preset ) {
	if ( isset( $preset['colors'] ) && 'unset' === $preset['colors'] ) {
		return 'none';
	}
	$filter_id = gutenberg_get_duotone_filter_id( $preset );
	return "url('#" . $filter_id . "')";
}

/**
 * Returns the duotone filter SVG string for the preset.
 *
 * @param  array $preset Duotone preset value as seen in theme.json.
 * @return string        Duotone SVG filter.
 */
function gutenberg_get_duotone_filter_svg( $preset ) {
	$filter_id = gutenberg_get_duotone_filter_id( $preset );

	$duotone_values = array(
		'r' => array(),
		'g' => array(),
		'b' => array(),
		'a' => array(),
	);

	if ( ! isset( $preset['colors'] ) || ! is_array( $preset['colors'] ) ) {
		$preset['colors'] = array();
	}

	foreach ( $preset['colors'] as $color_str ) {
		$tinycolor = new WP_Tinycolor_Gutenberg( $color_str );
		$color     = $tinycolor->to_rgb();

		$duotone_values['r'][] = $color['r'] / 255;
		$duotone_values['g'][] = $color['g'] / 255;
		$duotone_values['b'][] = $color['b'] / 255;
		$duotone_values['a'][] = $color['a'];
	}

	ob_start();

	?>

	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 0 0"
		width="0"
		height="0"
		focusable="false"
		role="none"
		style="visibility: hidden; position: absolute; left: -9999px; overflow: hidden;"
	>
		<defs>
			<filter id="<?php echo esc_attr( $filter_id ); ?>">
				<feColorMatrix
					color-interpolation-filters="sRGB"
					type="matrix"
					values="
						.299 .587 .114 0 0
						.299 .587 .114 0 0
						.299 .587 .114 0 0
						.299 .587 .114 0 0
					"
				/>
				<feComponentTransfer color-interpolation-filters="sRGB" >
					<feFuncR type="table" tableValues="<?php echo esc_attr( implode( ' ', $duotone_values['r'] ) ); ?>" />
					<feFuncG type="table" tableValues="<?php echo esc_attr( implode( ' ', $duotone_values['g'] ) ); ?>" />
					<feFuncB type="table" tableValues="<?php echo esc_attr( implode( ' ', $duotone_values['b'] ) ); ?>" />
					<feFuncA type="table" tableValues="<?php echo esc_attr( implode( ' ', $duotone_values['a'] ) ); ?>" />
				</feComponentTransfer>
				<feComposite in2="SourceGraphic" operator="in" />
			</filter>
		</defs>
	</svg>

	<?php

	$svg = ob_get_clean();

	if ( ! SCRIPT_DEBUG ) {
		// Clean up the whitespace.
		$svg = preg_replace( "/[\r\n\t ]+/", ' ', $svg );
		$svg = str_replace( '> <', '><', $svg );
		$svg = trim( $svg );
	}

	return $svg;
}

/**
 * Registers the style and colors block attributes for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_duotone_support( $block_type ) {
	$has_duotone_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_duotone_support = _wp_array_get( $block_type->supports, array( 'color', '__experimentalDuotone' ), false );
	}

	if ( $has_duotone_support ) {
		if ( ! $block_type->attributes ) {
			$block_type->attributes = array();
		}

		if ( ! array_key_exists( 'style', $block_type->attributes ) ) {
			$block_type->attributes['style'] = array(
				'type' => 'object',
			);
		}
	}
}

/**
 * Render out the duotone stylesheet and SVG.
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function gutenberg_render_duotone_support( $block_content, $block ) {
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );

	$duotone_support = false;
	if ( $block_type && property_exists( $block_type, 'supports' ) ) {
		$duotone_support = _wp_array_get( $block_type->supports, array( 'color', '__experimentalDuotone' ), false );
	}

	$has_duotone_attribute = isset( $block['attrs']['style']['color']['duotone'] );

	if (
		! $duotone_support ||
		! $has_duotone_attribute
	) {
		return $block_content;
	}

	// Possible values for duotone attribute:
	// 1. Array of colors - e.g. array('#000000', '#ffffff').
	// 2. Slug of an existing Duotone preset - e.g. 'green-blue'.
	// 3. The string 'unset' - indicates explicitly "no Duotone"..
	$duotone_attr = $block['attrs']['style']['color']['duotone'];

	$is_duotone_colors_array = is_array( $duotone_attr );
	$is_duotone_preset       = ! $is_duotone_colors_array && strpos( $duotone_attr, 'var:preset|duotone|' ) === 0;

	if ( $is_duotone_preset ) {
		$slug          = str_replace( 'var:preset|duotone|', '', $duotone_attr );
		$filter_preset = array(
			'slug' => $slug,
		);

		// Utilise existing CSS custom property.
		$filter_property = "var(--wp--preset--duotone--$slug)";
	} else {
		// Handle when Duotone is either:
		// - "unset"
		// - an array of colors.

		// Build a unique slug for the filter based on the array of colors.
		$filter_key    = $is_duotone_colors_array ? implode( '-', $duotone_attr ) : $duotone_attr;
		$filter_preset = array(
			'slug'   => wp_unique_id( sanitize_key( $filter_key . '-' ) ),
			'colors' => $duotone_attr, // required for building the SVG with gutenberg_get_duotone_filter_svg.
		);

		// Build a customised CSS filter property for unique slug.
		$filter_property = gutenberg_get_duotone_filter_property( $filter_preset );
	}

	// - Applied as a class attribute to the block wrapper.
	// - Used as a selector to apply the filter to the block.
	$filter_id = gutenberg_get_duotone_filter_id( $filter_preset );

	// Build the CSS selectors to which the filter will be applied.
	// Todo - encapsulate this in a function.
	$scope     = '.' . $filter_id;
	$selectors = explode( ',', $duotone_support );
	$scoped    = array();
	foreach ( $selectors as $sel ) {
		$scoped[] = $scope . ' ' . trim( $sel );
	}
	$selector = implode( ', ', $scoped );

	// Calling gutenberg_style_engine_get_stylesheet_from_css_rules ensures that
	// the styles are rendered in an inline for block supports because we're
	// using the `context` option to instruct it so.
	gutenberg_style_engine_get_stylesheet_from_css_rules(
		array(
			array(
				'selector'     => $selector,
				'declarations' => array(
					// !important is needed because these styles
					// render before global styles,
					// and they should be overriding the duotone
					// filters set by global styles.
					'filter' => $filter_property . ' !important',
				),
			),
		),
		array(
			'context' => 'block-supports',
		)
	);

	// For *non*-presets then generate an SVG for the filter.
	// Note: duotone presets are already pre-generated so no need to do this again.
	if ( $is_duotone_colors_array ) {
		$filter_svg = gutenberg_get_duotone_filter_svg( $filter_preset );

		add_action(
			'wp_footer',
			static function () use ( $filter_svg, $selector ) {
				echo $filter_svg;

				/*
				 * Safari renders elements incorrectly on first paint when the
				 * SVG filter comes after the content that it is filtering, so
				 * we force a repaint with a WebKit hack which solves the issue.
				 */
				global $is_safari;
				if ( $is_safari ) {
					/*
					 * Simply accessing el.offsetHeight flushes layout and style
					 * changes in WebKit without having to wait for setTimeout.
					 */
					printf(
						'<script>( function() { var el = document.querySelector( %s ); var display = el.style.display; el.style.display = "none"; el.offsetHeight; el.style.display = display; } )();</script>',
						wp_json_encode( $selector )
					);
				}
			}
		);
	}

	// Like the layout hook, this assumes the hook only applies to blocks with a single wrapper.
	return preg_replace(
		'/' . preg_quote( 'class="', '/' ) . '/',
		'class="' . $filter_id . ' ',
		$block_content,
		1
	);
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'duotone',
	array(
		'register_attribute' => 'gutenberg_register_duotone_support',
	)
);

// Remove WordPress core filter to avoid rendering duplicate support elements.
remove_filter( 'render_block', 'wp_render_duotone_support', 10, 2 );
add_filter( 'render_block', 'gutenberg_render_duotone_support', 10, 2 );
