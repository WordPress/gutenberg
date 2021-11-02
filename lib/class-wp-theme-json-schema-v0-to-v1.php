<?php
/**
 * Class that implements a WP_Theme_JSON_Schema migration.
 *
 * @package gutenberg
 */

/**
 * Class that migrates a given structure in v0 schema to one
 * that follows the v1 schema.
 */
class WP_Theme_JSON_Schema_V0_To_V1 implements WP_Theme_JSON_Schema {

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
	 * Converts a v0 data structure into a v1 one.
	 *
	 * It expects input data to come in v0 form:
	 *
	 * {
	 *   'root': {
	 *     'settings': { ... },
	 *     'styles': { ... }
	 *   }
	 *   'core/paragraph': {
	 *     'styles': { ... },
	 *     'settings': { ... }
	 *   },
	 *   'core/heading/h1': {
	 *     'settings': { ... }
	 *     'styles': { ... }
	 *   },
	 *   'core/heading/h2': {
	 *     'settings': { ... }
	 *     'styles': { ... }
	 *   },
	 * }
	 *
	 * And it will return v1 form:
	 *
	 * {
	 *   'settings': {
	 *     'border': { ... }
	 *     'color': { ... },
	 *     'typography': { ... },
	 *     'spacing': { ... },
	 *     'custom': { ... },
	 *     'blocks': {
	 *       'core/paragraph': { ... }
	 *     }
	 *   },
	 *   styles: {
	 *     border: { ... }
	 *     color: { ... },
	 *     typography: { ... },
	 *     spacing: { ... },
	 *     custom: { ... },
	 *     blocks: {
	 *       core/paragraph: { ... }
	 *       core/heading: {
	 *         elements: {
	 *           h1: { ... },
	 *           h2: { ... }
	 *         }
	 *       }
	 *     }
	 *   }
	 * }
	 *
	 * @param array $old Data in v0 schema.
	 *
	 * @return array Data in v1 schema.
	 */
	public static function migrate( $old ) {
		// Copy everything.
		$new = $old;

		// Overwrite the things that change.
		if ( isset( $old['settings'] ) ) {
			$new['settings'] = self::process_settings( $old['settings'] );
		}
		if ( isset( $old['styles'] ) ) {
			$new['styles'] = self::process_styles( $old['styles'] );
		}

		$new['version'] = 1;

		return $new;
	}

	/**
	 * Processes the settings subtree.
	 *
	 * @param array $settings Array to process.
	 *
	 * @return array The settings in the new format.
	 */
	private static function process_settings( $settings ) {
		$new                   = array();
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
	 *
	 * @return array The styles in the new format.
	 */
	private static function process_styles( $styles ) {
		$new                   = array();
		$block_heading         = array(
			'core/heading/h1' => 'h1',
			'core/heading/h2' => 'h2',
			'core/heading/h3' => 'h3',
			'core/heading/h4' => 'h4',
			'core/heading/h5' => 'h5',
			'core/heading/h6' => 'h6',
		);
		$blocks_to_consolidate = array(
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
		 * - link element => transform from link color property
		 * - heading elements => consolidate multiple blocks (core/heading/h1, core/heading/h2)
		 *   into a single one (core/heading).
		 */
		$new['blocks'] = $styles;

		// link elements.
		foreach ( $new['blocks'] as $block_name => $metadata ) {
			if ( isset( $metadata['color']['link'] ) ) {
				$new['blocks'][ $block_name ]['elements']['link']['color']['text'] = $metadata['color']['link'];
				unset( $new['blocks'][ $block_name ]['color']['link'] );
			}
		}

		/*
		 * The heading block needs a special treatment:
		 *
		 * - if it has a link color => it needs to be moved to the blocks.core/heading
		 * - the rest is consolidated into the corresponding element
		 *
		 */
		foreach ( $block_heading as $old_name => $new_name ) {
			if ( ! isset( $new['blocks'][ $old_name ] ) ) {
				continue;
			}

			gutenberg_experimental_set( $new, array( 'elements', $new_name ), $new['blocks'][ $old_name ] );

			if ( isset( $new['blocks'][ $old_name ]['elements'] ) ) {
				gutenberg_experimental_set( $new, array( 'blocks', 'core/heading', 'elements' ), $new['blocks'][ $old_name ]['elements'] );
			}

			unset( $new['blocks'][ $old_name ] );

		}

		/*
		 * Port the styles from the old blocks to the new,
		 * overriding the previous values.
		 */
		foreach ( $blocks_to_consolidate as $old_name => $new_name ) {
			if ( ! isset( $new['blocks'][ $old_name ] ) ) {
				continue;
			}

			gutenberg_experimental_set( $new, array( 'blocks', $new_name ), $new['blocks'][ $old_name ] );
			unset( $new['blocks'][ $old_name ] );

		}

		return $new;
	}
}
