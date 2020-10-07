<?php
/**
 * Duotone block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style and colors block attributes for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_duotone_support( $block_type ) {
	$has_duotone_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_duotone_support = gutenberg_experimental_get( $block_type->supports, array( 'duotone' ), false );
	}

	if ( $has_duotone_support ) {
		if ( ! $block_type->attributes ) {
			$block_type->attributes = array();
		}

		if ( ! array_key_exists( 'duotoneId', $block_type->attributes ) ) {
			$block_type->attributes['duotoneId'] = array(
				'type' => 'string',
			);
		}

		if ( ! array_key_exists( 'duotoneValues', $block_type->attributes ) ) {
			$block_type->attributes['duotoneValues'] = array(
				'type' => 'object',
			);
		}
	}
}


/**
 * Add CSS classes and inline styles for colors to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param  array         $attributes       Comprehensive list of attributes to be applied.
 * @param  array         $block_attributes Block attributes.
 * @param  WP_Block_Type $block_type       Block type.
 *
 * @return array Colors CSS classes and inline styles.
 */
function gutenberg_apply_duotone_support( $attributes, $block_attributes, $block_type ) {
	$has_duotone_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_duotone_support = gutenberg_experimental_get( $block_type->supports, array( 'duotone' ), false );
	}
	if ( $has_duotone_support ) {
		$has_duotone_id     = array_key_exists( 'duotoneId', $block_attributes );
		$has_duotone_colors = array_key_exists( 'duotoneValues', $block_attributes );

		if ( $has_duotone_id && $has_duotone_colors ) {
			$attributes['css_classes'][] = $block_attributes['duotoneId'];
		}
	}

	return $attributes;
}

/**
 * Render out the duotone stylesheet and SVG.
 *
 * @param  string        $block_content    Rendered block content.
 * @param  array         $block_attributes Block attributes.
 * @param  WP_Block_Type $block_type       Block type.
 *
 * @return string filtered block content.
 */
function gutenberg_render_duotone_support( $block_content, $block_attributes, $block_type ) {
	$has_duotone_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_duotone_support = gutenberg_experimental_get( $block_type->supports, array( 'duotone' ), false );
	}

	$has_duotone_id     = array_key_exists( 'duotoneId', $block_attributes );
	$has_duotone_colors = array_key_exists( 'duotoneValues', $block_attributes );

	if (
		! $has_duotone_support ||
		! $has_duotone_id ||
		! $has_duotone_colors
	) {
		return $block_content;
	}

	$duotone_id     = $block_attributes['duotoneId'];
	$duotone_colors = $block_attributes['duotoneValues'];

	// TODO: Handle multiple selectors
	$duotone_selector = '.' . $duotone_id;
	if ( is_string( $has_duotone_support ) ) {
		$duotone_selector .= ' ' . $has_duotone_support;
	} elseif ( is_string( $has_duotone_support['save'] ) ) {
		$duotone_selector .= ' ' . $has_duotone_support->save;
	}

	ob_start();

	?>

	<style>
		<?php echo $duotone_selector; ?> {
			filter: url( <?php echo '#' . $duotone_id; ?> );
		}
	</style>

	<svg
		xmlns:xlink="http://www.w3.org/1999/xlink"
		viewBox="0 0 0 0"
		width="0"
		height="0"
		focusable="false"
		role="none"
		style="visibility: hidden; position: absolute; left: -9999px; overflow: hidden;"
	>
		<defs>
			<filter id="<?php echo $duotone_id; ?>">
				<feColorMatrix
					type="matrix"
					<?php // phpcs:disable Generic.WhiteSpace.DisallowSpaceIndent ?>
					values=".299 .587 .114 0 0
					        .299 .587 .114 0 0
					        .299 .587 .114 0 0
					        0 0 0 1 0"
					<?php // phpcs:enable Generic.WhiteSpace.DisallowSpaceIndent ?>
				/>
				<feComponentTransfer color-interpolation-filters="sRGB">
					<feFuncR type="table" tableValues="<?php echo join( ' ', $duotone_colors['r'] ); ?>" />
					<feFuncG type="table" tableValues="<?php echo join( ' ', $duotone_colors['g'] ); ?>" />
					<feFuncB type="table" tableValues="<?php echo join( ' ', $duotone_colors['b'] ); ?>" />
				</feComponentTransfer>
			</filter>
		</defs>
	</svg>

	<?php

	$duotone = ob_get_clean();

	return $block_content . $duotone;
}
