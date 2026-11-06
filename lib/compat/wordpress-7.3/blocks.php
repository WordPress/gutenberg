<?php
/**
 * Block API compatibility for WordPress 7.3.
 *
 * @package gutenberg
 */

/**
 * Returns the allowed SVG tags and attributes for icon sanitization.
 *
 * @since 7.3.0
 *
 * @return array<string, array<string, bool>> Associative array of allowed SVG elements and their attributes.
 */
function gutenberg_get_allowed_svg_icon_tags() {
	// wp_kses() matches lowercase names against these keys.
	$svg_attributes = array(
		'xmlns'               => true,
		'viewbox'             => true,
		'preserveaspectratio' => true,
		'width'               => true,
		'height'              => true,
		'fill'                => true,
		'fill-opacity'        => true,
		'stroke'              => true,
		'stroke-width'        => true,
		'stroke-linecap'      => true,
		'stroke-linejoin'     => true,
		'opacity'             => true,
		'transform'           => true,
		'cx'                  => true,
		'cy'                  => true,
		'r'                   => true,
		'rx'                  => true,
		'ry'                  => true,
		'x'                   => true,
		'y'                   => true,
		'd'                   => true,
		'clip-rule'           => true,
		'fill-rule'           => true,
		'points'              => true,
		'type'                => true,
		'id'                  => true,
		'offset'              => true,
		'stop-color'          => true,
		'stop-opacity'        => true,
		'gradientunits'       => true,
		'gradienttransform'   => true,
		'x1'                  => true,
		'y1'                  => true,
		'x2'                  => true,
		'y2'                  => true,
		'clip-path'           => true,
		'mask'                => true,
		'filter'              => true,
		'stroke-dasharray'    => true,
		'stroke-dashoffset'   => true,
		'stroke-miterlimit'   => true,
		'stroke-opacity'      => true,
		'clippathunits'       => true,
		'maskunits'           => true,
		'maskcontentunits'    => true,
		'filterunits'         => true,
		'spreadmethod'        => true,
		'fx'                  => true,
		'fy'                  => true,
		'stddeviation'        => true,
		'in'                  => true,
		'in2'                 => true,
		'result'              => true,
		'mode'                => true,
		'values'              => true,
		'operator'            => true,
		'flood-color'         => true,
		'flood-opacity'       => true,
		'dx'                  => true,
		'dy'                  => true,
	);

	$allowed_tags = array(
		'svg'            => $svg_attributes,
		'path'           => $svg_attributes,
		'circle'         => $svg_attributes,
		'rect'           => $svg_attributes,
		'line'           => $svg_attributes,
		'polyline'       => $svg_attributes,
		'polygon'        => $svg_attributes,
		'ellipse'        => $svg_attributes,
		'g'              => $svg_attributes,
		'defs'           => $svg_attributes,
		'use'            => $svg_attributes,
		'stop'           => $svg_attributes,
		'lineargradient' => $svg_attributes,
		'radialgradient' => $svg_attributes,
		'title'          => $svg_attributes,
		'desc'           => $svg_attributes,
		'symbol'         => $svg_attributes,
		'clippath'       => $svg_attributes,
		'mask'           => $svg_attributes,
		'filter'         => $svg_attributes,
		'fegaussianblur' => $svg_attributes,
		'fecolormatrix'  => $svg_attributes,
		'feblend'        => $svg_attributes,
		'fecomposite'    => $svg_attributes,
		'feflood'        => $svg_attributes,
		'femerge'        => $svg_attributes,
		'femergenode'    => $svg_attributes,
		'feoffset'       => $svg_attributes,
		'feimage'        => $svg_attributes,
	);

	return $allowed_tags;
}

/**
 * Sanitizes SVG content for safe use as a block icon.
 *
 * Strips dangerous elements and attributes (scripts, event handlers, etc.)
 * while preserving valid SVG structure.
 *
 * @since 7.3.0
 *
 * @param string $svg_content Raw SVG content.
 * @return string Sanitized SVG content.
 */
function gutenberg_sanitize_svg_icon( $svg_content ) {
	// Remove markup that wp_kses() would keep, or would turn into stray text.
	$svg_element = preg_replace(
		array(
			'/<\?xml.*?\?>/is',
			'/<!--.*?(?:-->|$)/s',
			'/<!DOCTYPE[^>\[]*(?:\[.*?\]\s*)?>/is',
			'#<(script|style)\b.*?(?:</\1\s*>|$)#is',
		),
		'',
		$svg_content
	);

	$svg_element = wp_kses(
		$svg_element,
		gutenberg_get_allowed_svg_icon_tags()
	);

	// wp_kses() lowercases names, but SVG names are case-sensitive.
	$svg_elements   = array( 'linearGradient', 'radialGradient', 'clipPath', 'feGaussianBlur', 'feColorMatrix', 'feBlend', 'feComposite', 'feFlood', 'feMerge', 'feMergeNode', 'feOffset', 'feImage' );
	$svg_attributes = array( 'viewBox', 'preserveAspectRatio', 'gradientUnits', 'gradientTransform', 'clipPathUnits', 'maskUnits', 'maskContentUnits', 'filterUnits', 'spreadMethod', 'stdDeviation' );
	foreach ( $svg_elements as $name ) {
		$svg_element = preg_replace( '#(</?)' . strtolower( $name ) . '(?=[\s/>])#', '$1' . $name, $svg_element );
	}
	foreach ( $svg_attributes as $name ) {
		$svg_element = preg_replace( '/(\s)' . strtolower( $name ) . '(?==")/', '$1' . $name, $svg_element );
	}

	return trim( $svg_element );
}

/**
 * Resolves file: prefix for the icon in block.json metadata.
 *
 * Allows block authors to use a file path (e.g., "file:./assets/icon.svg")
 * instead of an inline SVG or Dashicon slug for the block icon.
 *
 * @since 7.3.0
 *
 * @param array $metadata Block metadata loaded from block.json.
 * @return array Filtered metadata with resolved icon.
 */
function gutenberg_resolve_block_icon_path( $metadata ) {
	if ( ! isset( $metadata['icon'] ) || ! isset( $metadata['file'] ) ) {
		return $metadata;
	}

	$resolve_svg_path = function ( $path ) use ( $metadata ) {
		if ( ! is_string( $path ) ) {
			return $path;
		}
		$resolved_path = remove_block_asset_path_prefix( $path );
		if ( $resolved_path === $path ) {
			return $path;
		}
		$full_path = wp_normalize_path(
			realpath( dirname( $metadata['file'] ) . '/' . $resolved_path )
		);
		if ( ! $full_path || ! is_file( $full_path ) ) {
			_doing_it_wrong(
				'gutenberg_resolve_block_icon_path',
				sprintf(
					/* translators: %s: path to the icon file */
					__( 'Icon file not found: %s', 'gutenberg' ),
					$resolved_path
				),
				'7.3.0'
			);
			return $path;
		}
		$svg_element = gutenberg_sanitize_svg_icon( (string) file_get_contents( $full_path ) );
		if ( ! str_starts_with( $svg_element, '<svg' ) ) {
			_doing_it_wrong(
				'gutenberg_resolve_block_icon_path',
				sprintf(
					/* translators: %s: path to the icon file */
					__( 'Icon file is not a valid SVG: %s', 'gutenberg' ),
					$resolved_path
				),
				'7.3.0'
			);
			return $path;
		}
		return $svg_element;
	};

	if ( is_string( $metadata['icon'] ) ) {
		$metadata['icon'] = $resolve_svg_path( $metadata['icon'] );
	} elseif ( is_array( $metadata['icon'] ) && isset( $metadata['icon']['src'] ) ) {
		$metadata['icon']['src'] = $resolve_svg_path( $metadata['icon']['src'] );
	}

	return $metadata;
}
add_filter( 'block_type_metadata', 'gutenberg_resolve_block_icon_path' );
