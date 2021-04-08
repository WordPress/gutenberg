<?php
/**
 * Class that implements a WP_Theme_JSON_Schema to convert
 * a given structure in v0 schema to the latest one.
 *
 * @package gutenberg
 */

/**
 * Class that implements a WP_Theme_JSON_Schema to convert
 * a given structure in v0 schema to the latest one.
 */
class WP_Theme_JSON_Schema_V0 implements WP_Theme_JSON_Schema {

	/**
	 * How to address all the blocks
	 * in the theme.json file.
	 */
	const ALL_BLOCKS_NAME = 'defaults';

	/**
	 * How to address the root block
	 * in the theme.json file.
	 *
	 * @var string
	 */
	const ROOT_BLOCK_NAME = 'root';

	/**
	 * Data schema of each block within a theme.json.
	 *
	 * Example:
	 *
	 * {
	 *   'block-one': {
	 *     'styles': {
	 *       'color': {
	 *         'background': 'color'
	 *       }
	 *     },
	 *     'settings': {
	 *       'color': {
	 *         'custom': true
	 *       }
	 *     }
	 *   },
	 *   'block-two': {
	 *     'styles': {
	 *       'color': {
	 *         'link': 'color'
	 *       }
	 *     }
	 *   }
	 * }
	 */
	const SCHEMA = array(
		'customTemplates' => null,
		'templateParts'   => null,
		'styles'          => array(
			'border'     => array(
				'radius' => null,
				'color'  => null,
				'style'  => null,
				'width'  => null,
			),
			'color'      => array(
				'background' => null,
				'gradient'   => null,
				'link'       => null,
				'text'       => null,
			),
			'spacing'    => array(
				'padding' => array(
					'top'    => null,
					'right'  => null,
					'bottom' => null,
					'left'   => null,
				),
			),
			'typography' => array(
				'fontFamily'     => null,
				'fontSize'       => null,
				'fontStyle'      => null,
				'fontWeight'     => null,
				'lineHeight'     => null,
				'textDecoration' => null,
				'textTransform'  => null,
			),
		),
		'settings'        => array(
			'border'     => array(
				'customRadius' => null,
				'customColor'  => null,
				'customStyle'  => null,
				'customWidth'  => null,
			),
			'color'      => array(
				'custom'         => null,
				'customGradient' => null,
				'gradients'      => null,
				'link'           => null,
				'palette'        => null,
			),
			'spacing'    => array(
				'customPadding' => null,
				'units'         => null,
			),
			'typography' => array(
				'customFontSize'        => null,
				'customLineHeight'      => null,
				'dropCap'               => null,
				'fontFamilies'          => null,
				'fontSizes'             => null,
				'customFontStyle'       => null,
				'customFontWeight'      => null,
				'customTextDecorations' => null,
				'customTextTransforms'  => null,
			),
			'custom'     => null,
			'layout'     => null,
		),
	);

	/**
	 * Converts a v0 schema into the latest.
	 *
	 * @param array $old Data in v0 schema.
	 *
	 * @return array Data in the latest schema.
	 */
	public static function parse( $old ) {
		// Copy everything.
		$new = $old;

		$blocks_to_consolidate = array(
			'core/heading/h1'     => 'core/heading',
			'core/heading/h2'     => 'core/heading',
			'core/heading/h3'     => 'core/heading',
			'core/heading/h4'     => 'core/heading',
			'core/heading/h5'     => 'core/heading',
			'core/heading/h6'     => 'core/heading',
			'core/post-title/h1'  => 'core/post-title',
			'core/post-title/h2'  => 'core/post-title',
			'core/post-title/h3'  => 'core/post-title',
			'core/post-title/h4'  => 'core/post-title',
			'core/post-title/h5'  => 'core/post-title',
			'core/post-title/h6'  => 'core/post-title',
			'core/query-title/h1' => 'core/query-title',
			'core/query-title/h2' => 'core/query-title',
			'core/query-title/h3' => 'core/query-title',
			'core/query-title/h4' => 'core/query-title',
			'core/query-title/h5' => 'core/query-title',
			'core/query-title/h6' => 'core/query-title',
		);

		// Overwrite the things that change.
		if ( isset( $old['settings'] ) ) {
			$new['settings'] = self::process_settings( $old['settings'], $blocks_to_consolidate );
		}
		if ( isset( $old['styles'] ) ) {
			$new['styles'] = self::process_styles( $old['styles'], $blocks_to_consolidate );
		}

		$new['version'] = 1;

		return $new;
	}

	/**
	 * Processes the settings subtree.
	 *
	 * @param array $settings Array to process.
	 * @param array $blocks_to_consolidate A list of blocks that are transformed.
	 *
	 * @return array The settings in the new format.
	 */
	private static function process_settings( $settings, $blocks_to_consolidate ) {
		$new = array();

		$paths_to_override = array(
			array( 'color', 'palette' ),
			array( 'color', 'gradients' ),
			array( 'spacing', 'units' ),
			array( 'typography', 'fontSizes' ),
			array( 'typography', 'fontFamilies' ),
			array( 'custom' ),
		);

		// 'defaults' settings become top-level.
		if ( isset( $settings[ self::ALL_BLOCKS_NAME ] ) ) {
			$new = $settings[ self::ALL_BLOCKS_NAME ];
			unset( $settings[ self::ALL_BLOCKS_NAME ] );
		}

		// 'root' settings override 'defaults'.
		if ( isset( $settings[ self::ROOT_BLOCK_NAME ] ) ) {
			$new = array_replace_recursive( $new, $settings[ self::ROOT_BLOCK_NAME ] );

			// The array_replace_recursive algorithm merges at the leaf level.
			// This means that when a leaf value is an array,
			// the incoming array won't replace the existing,
			// but the numeric indexes are used for replacement.
			//
			// These cases we hold into $paths_to_override
			// and need to replace them with the new data.
			foreach ( $paths_to_override as $path ) {
				$root_value = _wp_array_get(
					$settings,
					array_merge( array( self::ROOT_BLOCK_NAME ), $path ),
					null
				);
				if ( null !== $root_value ) {
					gutenberg_experimental_set( $new, $path, $root_value );
				}
			}

			unset( $settings[ self::ROOT_BLOCK_NAME ] );
		}

		if ( empty( $settings ) ) {
			return $new;
		}

		/*
		 * At this point, it only contains block's data.
		 * However, some block data we need to consolidate
		 * into a different section, as it's the case for:
		 *
		 * - core/heading/h1, core/heading/h2, ...         => core/heading
		 * - core/post-title/h1, core/post-title/h2, ...   => core/post-title
		 * - core/query-title/h1, core/query-title/h2, ... => core/query-title
		 *
		 */
		$new['blocks'] = $settings;
		foreach ( $blocks_to_consolidate as $old_name => $new_name ) {
			// Unset the $old_name.
			unset( $new[ $old_name ] );

			// Consolidate the $new value.
			$block_settings = _wp_array_get( $settings, array( $old_name ), null );
			if ( null !== $block_settings ) {
				$new_path     = array( 'blocks', $new_name );
				$new_settings = array();
				gutenberg_experimental_set( $new_settings, $new_path, $block_settings );

				$new = array_replace_recursive( $new, $new_settings );
				foreach ( $paths_to_override as $path ) {
					$block_value = _wp_array_get( $block_settings, $path, null );
					if ( null !== $block_value ) {
						gutenberg_experimental_set( $new, array_merge( $new_path, $path ), $block_value );
					}
				}
			}
		}

		return $new;
	}

	/**
	 * Processes the styles subtree.
	 *
	 * @param array $styles Array to process.
	 * @param array $blocks_to_consolidate A list of blocks that are transformed.
	 *
	 * @return array The styles in the new format.
	 */
	private static function process_styles( $styles, $blocks_to_consolidate ) {
		$new = array();

		// Styles within root become top-level.
		if ( isset( $styles[ self::ROOT_BLOCK_NAME ] ) ) {
			$new = $styles[ self::ROOT_BLOCK_NAME ];
			unset( $styles[ self::ROOT_BLOCK_NAME ] );

			// Transform root.styles.color.link into elements.link.color.text.
			if ( isset( $new['color']['link'] ) ) {
				$new['elements']['link']['color']['text'] = $new['color']['link'];
				unset( $new['color']['link'] );
			}
		}

		if ( empty( $styles ) ) {
			return $new;
		}

		/*
		 * At this point, it only contains block's data.
		 * However, we still need to consolidate a few things:
		 *
		 * - link element => tranform from link color property
		 * - heading elements => consolidate multiple blocks (core/heading/h1, core/heading/h2)
		 *   into a single one with elements (core/heading with elements h1, h2, etc).
		 */
		$new['blocks'] = $styles;

		// link elements.
		foreach ( $new['blocks'] as $block_name => $metadata ) {
			if ( isset( $metadata['color']['link'] ) ) {
				$new['blocks'][ $block_name ]['elements']['link']['color']['text'] = $metadata['color']['link'];
				unset( $new['blocks'][ $block_name ]['color']['link'] );
			}
		}

		// heading elements.
		foreach ( $blocks_to_consolidate as $old_name => $new_name ) {
			if ( ! isset( $new['blocks'][ $old_name ] ) ) {
				continue;
			}

			if ( ! isset( $new['blocks'][ $new_name ] ) ) {
				$new['blocks'][ $new_name ] = array();
			}

			/*
			 * First, port the existing link color element to the block,
			 * overriding the previous value.
			 */
			if ( isset( $new['blocks'][ $old_name ]['elements'] ) ) {
				$new['blocks'][ $new_name ]['elements']['link'] = $new['blocks'][ $old_name ]['elements']['link'];
				unset( $new['blocks'][ $old_name ]['elements'] );
			}

			/*
			 * Then, port any style categories left to the element
			 * resulting of exploding the previous block selector:
			 *
			 * - core/heading/h1 => h1 element
			 * - core/heading/h2 => h2 element
			 * - and so on
			 */
			if ( isset( $new['blocks'][ $old_name ] ) ) {
				$element_name = explode( '/', $old_name )[2];
				$new['blocks'][ $new_name ]['elements'][ $element_name ] = $new['blocks'][ $old_name ];
				unset( $new['blocks'][ $old_name ] );
			}
		}

		return $new;
	}
}
