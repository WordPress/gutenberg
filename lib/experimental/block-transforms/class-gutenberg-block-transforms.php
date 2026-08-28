<?php
/**
 * Server-side conversion of one block type into another.
 *
 * @package gutenberg
 */

/**
 * Switches blocks to another block type using the transforms block types declare.
 *
 * This is the PHP counterpart of `switchToBlockType()` in `@wordpress/blocks`,
 * limited to the transforms that can be written as data in `block.json`.
 *
 * A transform produces the target block's attributes. It does not produce the
 * target block's saved markup, which only its JavaScript `save()` can generate.
 * Conversion is therefore refused for a target that saves markup, and allowed
 * for a target that renders on the server, whose serialization is complete
 * without any.
 *
 * @access private
 */
class Gutenberg_Block_Transforms {
	/**
	 * Converts blocks to another block type.
	 *
	 * @param array[]|array $blocks      Parsed block array, or a list of them. A list is
	 *                                   only accepted by a transform marked `isMultiBlock`.
	 * @param string        $target_name Name of the block type to convert to.
	 * @return array[]|null Parsed block arrays, or null when no transform applies.
	 */
	public static function switch_block_type( $blocks, $target_name ) {
		// A single parsed block carries a `blockName`, which is null for classic
		// content, so the key has to be looked for rather than its value.
		$blocks = array_key_exists( 'blockName', $blocks ) ? array( $blocks ) : array_values( $blocks );

		if ( array() === $blocks ) {
			return null;
		}

		$registry    = WP_Block_Type_Registry::get_instance();
		$target_type = $registry->get_registered( $target_name );

		if ( ! $target_type instanceof WP_Block_Type ) {
			return null;
		}

		$source_name = isset( $blocks[0]['blockName'] ) ? $blocks[0]['blockName'] : null;
		$source_type = null === $source_name ? null : $registry->get_registered( $source_name );

		if ( ! $source_type instanceof WP_Block_Type ) {
			return null;
		}

		/*
		 * A declared transform maps one block's attributes onto another's. It
		 * has no way to say how several blocks' attributes combine, which only
		 * a JavaScript transform can express, so a multi-block selection is
		 * refused rather than silently converted from the first block alone.
		 */
		if ( count( $blocks ) > 1 ) {
			return null;
		}

		$transform = self::find_transform( $source_type, $target_type );

		if ( null === $transform ) {
			return null;
		}

		/*
		 * Only the target's attributes can be derived here. A block that saves
		 * markup needs its `save()` to produce any, so converting to one would
		 * lose the content it is supposed to carry.
		 */
		if ( ! $target_type->is_dynamic() ) {
			return null;
		}

		$attributes = self::map_attributes(
			isset( $transform['attributes'] ) ? $transform['attributes'] : null,
			$blocks[0]['attrs']
		);

		$inner_blocks = isset( $blocks[0]['innerBlocks'] ) ? $blocks[0]['innerBlocks'] : array();

		return array(
			array(
				'blockName'    => $target_name,
				'attrs'        => $attributes,
				'innerBlocks'  => $inner_blocks,
				'innerHTML'    => '',
				'innerContent' => array_fill( 0, count( $inner_blocks ), null ),
			),
		);
	}

	/**
	 * Finds the transform that converts one block type into another.
	 *
	 * The source's `to` transforms take precedence over the target's `from`
	 * transforms, matching the editor.
	 *
	 * @param WP_Block_Type $source_type Block type being converted.
	 * @param WP_Block_Type $target_type Block type to convert to.
	 * @return array|null Matching transform, or null.
	 */
	private static function find_transform( $source_type, $target_type ) {
		$candidates = array_merge(
			self::get_block_transforms( $source_type, 'to', $target_type->name ),
			self::get_block_transforms( $target_type, 'from', $source_type->name )
		);

		return isset( $candidates[0] ) ? $candidates[0] : null;
	}

	/**
	 * Returns a block type's block-to-block transforms naming another block.
	 *
	 * @param WP_Block_Type $block_type Block type whose transforms to read.
	 * @param string        $direction  Either `from` or `to`.
	 * @param string        $other_name Name the transform has to name.
	 * @return array[] Matching transforms, ordered by priority.
	 */
	private static function get_block_transforms( $block_type, $direction, $other_name ) {
		if ( ! isset( $block_type->transforms[ $direction ] ) || ! is_array( $block_type->transforms[ $direction ] ) ) {
			return array();
		}

		$matching = array();

		foreach ( $block_type->transforms[ $direction ] as $index => $transform ) {
			if ( ! is_array( $transform ) || ! isset( $transform['type'] ) || 'block' !== $transform['type'] ) {
				continue;
			}

			$blocks = isset( $transform['blocks'] ) ? (array) $transform['blocks'] : array();

			/*
			 * `*` says a transform accepts any source block. It cannot name a
			 * target, because a declared transform builds the block it names
			 * and there is no such block, so it only counts under `from` —
			 * the same as in the editor, which has to enumerate its targets.
			 */
			$matches_any = 'from' === $direction && in_array( '*', $blocks, true );

			if ( ! $matches_any && ! in_array( $other_name, $blocks, true ) ) {
				continue;
			}

			$transform['priority'] = isset( $transform['priority'] ) ? (int) $transform['priority'] : 10;
			$transform['order']    = $index;
			$matching[]            = $transform;
		}

		return self::sort_by_priority( $matching );
	}

	/**
	 * Returns every transform of one type declared by any registered block.
	 *
	 * @param string $type Transform type, such as `raw` or `shortcode`.
	 * @return array[] Transforms, each carrying the `blockName` it belongs to, in the order they should be tried.
	 */
	public static function get_declared_transforms( $type ) {
		$transforms = array();
		$order      = 0;

		foreach ( WP_Block_Type_Registry::get_instance()->get_all_registered() as $block_type ) {
			if ( ! isset( $block_type->transforms['from'] ) || ! is_array( $block_type->transforms['from'] ) ) {
				continue;
			}

			foreach ( $block_type->transforms['from'] as $transform ) {
				if ( ! is_array( $transform ) || ! isset( $transform['type'] ) || $type !== $transform['type'] ) {
					continue;
				}

				$transform['blockName'] = $block_type->name;
				$transform['priority']  = isset( $transform['priority'] ) ? (int) $transform['priority'] : 10;

				/*
				 * Registration order across every block, not the index within
				 * one block's own list: `usort` is only stable from PHP 8.0,
				 * so transforms of equal priority would otherwise resolve
				 * differently on the versions below it.
				 */
				$transform['order'] = $order;
				++$order;

				$transforms[] = $transform;
			}
		}

		return self::sort_by_priority( $transforms );
	}

	/**
	 * Returns the attributes worth writing into a block's delimiter.
	 *
	 * An attribute the block sources from its own markup is read back out of
	 * that markup, and one equal to the block's default is what the block
	 * would assume anyway, so neither belongs in the delimiter.
	 *
	 * @param WP_Block_Type $block_type Block type.
	 * @param array         $attributes Attribute values.
	 * @return array Attribute values.
	 */
	public static function remove_implied_attributes( $block_type, $attributes ) {
		$definitions = (array) $block_type->attributes;

		foreach ( $attributes as $name => $value ) {
			$definition = isset( $definitions[ $name ] ) ? $definitions[ $name ] : array();

			if ( isset( $definition['source'] ) ) {
				unset( $attributes[ $name ] );
				continue;
			}

			if ( array_key_exists( 'default', $definition ) && $definition['default'] === $value ) {
				unset( $attributes[ $name ] );
			}
		}

		return $attributes;
	}

	/**
	 * Orders transforms by priority, and by declaration order within a priority.
	 *
	 * @param array[] $transforms Transforms carrying `priority` and `order`.
	 * @return array[] Ordered transforms.
	 */
	public static function sort_by_priority( $transforms ) {
		usort(
			$transforms,
			static function ( $a, $b ) {
				return $a['priority'] === $b['priority']
					? $a['order'] - $b['order']
					: $a['priority'] - $b['priority'];
			}
		);

		return $transforms;
	}

	/**
	 * Applies the attribute policy a transform declares.
	 *
	 * `all` carries every attribute across, an array maps each new attribute
	 * name to the name it takes its value from, and anything else carries none.
	 *
	 * @param mixed $policy     Declared attribute policy.
	 * @param array $attributes Attributes of the block being converted.
	 * @return array Attributes for the resulting block.
	 */
	private static function map_attributes( $policy, $attributes ) {
		$attributes = is_array( $attributes ) ? $attributes : array();

		if ( 'all' === $policy ) {
			return $attributes;
		}

		if ( ! is_array( $policy ) ) {
			return array();
		}

		$mapped = array();

		foreach ( $policy as $name => $from ) {
			if ( is_string( $from ) && array_key_exists( $from, $attributes ) ) {
				$mapped[ $name ] = $attributes[ $from ];
			}
		}

		return $mapped;
	}
}
