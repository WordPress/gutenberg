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
 * for a target that renders on the server and reads nothing out of its own
 * markup, whose serialization is complete without any — see `server_markup()`
 * for the line and for what it cannot see.
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
		if ( ! is_array( $blocks ) ) {
			return null;
		}

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

		$transform = self::find_transform( $source_type, $target_type, $blocks );

		if ( null === $transform ) {
			return null;
		}

		$attributes = self::map_attributes(
			isset( $transform['attributes'] ) ? $transform['attributes'] : null,
			$blocks[0]['attrs']
		);

		/*
		 * Only the target's attributes can be derived here. A block that saves
		 * markup needs its `save()` to produce any, so converting to one would
		 * lose the content it is supposed to carry.
		 */
		$markup = self::server_markup( $target_type, $attributes );

		if ( null === $markup ) {
			return null;
		}

		$inner_blocks  = isset( $blocks[0]['innerBlocks'] ) ? $blocks[0]['innerBlocks'] : array();
		$inner_content = array_fill( 0, count( $inner_blocks ), null );

		if ( '' !== $markup ) {
			$inner_content[] = $markup;
		}

		return array(
			array(
				'blockName'    => $target_name,
				'attrs'        => self::remove_implied_attributes( $target_type, $attributes ),
				'innerBlocks'  => $inner_blocks,
				'innerHTML'    => $markup,
				'innerContent' => $inner_content,
			),
		);
	}

	/**
	 * Returns the markup a block serializes with on the server, or null.
	 *
	 * A transform produces a block's attributes and not its saved markup, which
	 * only its JavaScript `save()` can generate. Two kinds of block need none
	 * of it: one that renders on the server and reads nothing out of its own
	 * markup, whose serialization is complete without any, and one whose whole
	 * content is a single `raw` attribute — the Shortcode and Custom HTML
	 * blocks — which saves that value verbatim. Every other block is refused.
	 *
	 * What cannot be told apart from here is a block that renders on the
	 * server and still saves wrapper markup its attributes do not describe:
	 * it looks exactly like one saving none, and comes out without it.
	 *
	 * @param WP_Block_Type $block_type Block type.
	 * @param array         $attributes Attributes the block is built with.
	 * @return string|null Markup, possibly empty, or null when only `save()` could produce it.
	 */
	public static function server_markup( $block_type, $attributes ) {
		$sourced = array();

		foreach ( (array) $block_type->attributes as $name => $definition ) {
			if ( is_array( $definition ) && isset( $definition['source'] ) && 'meta' !== $definition['source'] ) {
				$sourced[ $name ] = $definition['source'];
			}
		}

		if ( 1 === count( $sourced ) && 'raw' === reset( $sourced ) ) {
			$name = key( $sourced );

			return isset( $attributes[ $name ] ) && is_string( $attributes[ $name ] ) ? $attributes[ $name ] : '';
		}

		if ( array() === $sourced && $block_type->is_dynamic() ) {
			return '';
		}

		return null;
	}

	/**
	 * Finds the transform that converts one block type into another.
	 *
	 * The source's `to` transforms take precedence over the target's `from`
	 * transforms, matching the editor.
	 *
	 * @param WP_Block_Type $source_type Block type being converted.
	 * @param WP_Block_Type $target_type Block type to convert to.
	 * @param array[]       $blocks      Parsed blocks being converted.
	 * @return array|null Matching transform, or null.
	 */
	private static function find_transform( $source_type, $target_type, $blocks ) {
		$candidates = array_merge(
			self::get_block_transforms( $source_type, 'to', $target_type->name ),
			self::get_block_transforms( $target_type, 'from', $source_type->name )
		);

		foreach ( $candidates as $candidate ) {
			// A transform registered from PHP may decide per block, as the
			// editor lets one do; a declared transform has nothing to decide.
			if (
				isset( $candidate['isMatch'] )
				&& self::is_runnable_callback( $candidate['isMatch'] )
				&& ! call_user_func( $candidate['isMatch'], $blocks[0]['attrs'], $blocks[0] )
			) {
				continue;
			}

			return $candidate;
		}

		return null;
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
	 * Determines whether a transform's callback may be called.
	 *
	 * A transform reaches `WP_Block_Type::$transforms` from a `block.json`
	 * file as often as from PHP, and JSON has no functions: a string there is
	 * a mistake, not a callback, and PHP would resolve it to whatever global
	 * function happens to bear that name. JSON spells a static method just as
	 * easily, so a two-string array is refused the same way. Only a callback
	 * JSON cannot express — a closure, or a bound object method — is called.
	 *
	 * @param mixed $callback Value declared for `isMatch` or `transform`.
	 * @return bool Whether it may be called.
	 */
	public static function is_runnable_callback( $callback ) {
		$named = is_string( $callback )
			|| ( is_array( $callback ) && isset( $callback[0] ) && ! is_object( $callback[0] ) );

		if ( $named ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'A block transform cannot reference its callback by name, because a name can be written into `block.json` and data must not choose what runs. Register the block from PHP with a closure to attach one.', 'gutenberg' ),
				'23.9.0'
			);

			return false;
		}

		return is_callable( $callback );
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
