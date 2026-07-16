<?php
/**
 * Gutenberg_View_Config_Data class
 *
 * @package gutenberg
 */

/**
 * Holds an entity's view configuration while it is being built.
 *
 * An instance of this class is what `get_entity_view_config_{$kind}_{$name}`
 * filter callbacks receive: a callback changes the configuration by calling
 * methods on the instance and returning it. The configuration has four
 * top-level keys — `default_view`, `default_layouts`, `view_list`, and
 * `form` — and there are two ways to contribute:
 *
 * - The `update_*()` methods merge partial changes (patches) into what is
 *   already there, each covering one part of the configuration:
 *   `update_properties()` for `default_view`, `default_layouts`, and the
 *   `form` settings; and `update_view_list_items()` for the `view_list`
 *   entries, keyed by view `slug`. This is what plugins should
 *   use: patches compose with core's configuration and with other plugins'.
 * - `set()` replaces a whole top-level key. It shouldn't be the default
 *   choice — a callback using it stops inheriting core's future changes to
 *   that key — but it's useful for cases like a post type that doesn't
 *   want the default form at all.
 *
 * Patches follow three shared rules: an associative array merges key by
 * key, a numerically indexed array replaces the current value wholesale,
 * and `null` deletes what it names — deleting a whole top-level key resets
 * it to its default. Each patch and each `set()` value also declares the
 * configuration schema version it was written against (currently 1), so a
 * future WordPress release that changes the configuration shape can migrate
 * existing patches forward instead of breaking them.
 *
 * @since 7.1.0
 */
class Gutenberg_View_Config_Data {

	/**
	 * The latest supported configuration schema version.
	 *
	 * @since 7.1.0
	 * @var int
	 */
	const LATEST_VERSION = 1;

	/**
	 * The documented top-level configuration keys.
	 *
	 * @since 7.1.0
	 * @var string[]
	 */
	const CONFIG_KEYS = array( 'default_view', 'default_layouts', 'view_list', 'form' );

	/**
	 * The configuration being contributed to.
	 *
	 * @since 7.1.0
	 * @var array
	 */
	private $config;

	/**
	 * Constructor.
	 *
	 * @since 7.1.0
	 *
	 * @param array $config The base configuration to contribute to.
	 */
	public function __construct( array $config ) {
		$this->config = $config;
	}

	/**
	 * Returns the current configuration array.
	 *
	 * @since 7.1.0
	 *
	 * @return array The configuration.
	 */
	public function get_config() {
		return $this->config;
	}

	/**
	 * Replaces a whole top-level key with a new value.
	 *
	 * It shouldn't be the default choice — a callback using it stops
	 * inheriting core's future changes to that key — but it's useful for
	 * cases like a post type that doesn't want the default form at all.
	 *
	 * A value that declares an unsupported schema version is rejected and
	 * does not replace anything.
	 *
	 * @since 7.1.0
	 *
	 * @param string $key     The configuration key to replace.
	 * @param mixed  $value   The new value.
	 * @param int    $version The schema version the value was authored against.
	 * @return Gutenberg_View_Config_Data The instance, for chaining.
	 */
	public function set( $key, $value, int $version ) {
		if ( ! $this->check_version( $version, __METHOD__ ) ) {
			return $this;
		}

		if ( ! in_array( $key, self::CONFIG_KEYS, true ) ) {
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: %s: the configuration key. */
					esc_html__( '"%s" is not a documented view configuration key.', 'gutenberg' ),
					esc_html( $key )
				),
				'7.1.0'
			);
			return $this;
		}

		$this->config[ $key ] = $value;
		return $this;
	}

	/**
	 * Merges a partial configuration into `default_view`, `default_layouts`,
	 * and the `form` settings other than its `fields`.
	 *
	 * An associative array merges key by key, a numerically indexed array
	 * replaces the current value wholesale, and `null` deletes the key it
	 * names; deleting a whole top-level key (any documented key, including
	 * `view_list`) resets it to its default.
	 *
	 * The `view_list` collection has a dedicated method and is rejected here:
	 * a non-null `view_list` value must go through `update_view_list_items()`.
	 *
	 * A patch that declares an unsupported schema version is rejected and
	 * does not merge.
	 *
	 * @since 7.1.0
	 *
	 * @param array $patch   The partial configuration to merge.
	 * @param int   $version The schema version the patch was authored against.
	 * @return Gutenberg_View_Config_Data The instance, for chaining.
	 */
	public function update_properties( array $patch, int $version ) {
		if ( ! $this->check_version( $version, __METHOD__ ) ) {
			return $this;
		}

		foreach ( $patch as $key => $value ) {
			if ( ! in_array( $key, self::CONFIG_KEYS, true ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: %s: the configuration key. */
						esc_html__( '"%s" is not a documented view configuration key.', 'gutenberg' ),
						esc_html( $key )
					),
					'7.1.0'
				);
				continue;
			}

			// A null patch value drops the whole key from the container rather
			// than assigning null.
			if ( null === $value ) {
				unset( $this->config[ $key ] );
				continue;
			}

			if ( 'view_list' === $key ) {
				_doing_it_wrong(
					__METHOD__,
					esc_html__( 'The "view_list" entries are patched by identity. Use update_view_list_items() instead.', 'gutenberg' ),
					'7.1.0'
				);
				continue;
			}

			if ( 'form' === $key ) {
				if ( ! is_array( $value ) || ( array() !== $value && array_is_list( $value ) ) ) {
					_doing_it_wrong(
						__METHOD__,
						esc_html__( 'A "form" patch must be an associative array of form properties.', 'gutenberg' ),
						'7.1.0'
					);
					$value = null;
				}

				// Nothing left to merge: the value was off-shape.
				if ( null === $value || array() === $value ) {
					continue;
				}
			}

			$this->config[ $key ] = $this->merge_properties( $this->config[ $key ] ?? array(), $value );
		}

		return $this;
	}

	/**
	 * Adds, updates, or removes `view_list` entries, keyed by view `slug`.
	 *
	 * Each patch key names the `slug` of the view it targets: a matching view
	 * merges in place and keeps its position (following the shared rules —
	 * e.g. the view's `filters`, being numerically indexed, replace
	 * wholesale), an unknown slug appends a new view to the end, and `null`
	 * removes the view. The patch key is the identity: a `slug` property
	 * inside the value is ignored. A `null` for a slug that is not found is a
	 * silent no-op — the view may have been removed by another callback or
	 * simply not apply to this entity.
	 *
	 * A patch that declares an unsupported schema version is rejected and
	 * does not merge.
	 *
	 * @since 7.1.0
	 *
	 * @param array $items   The view patches, keyed by slug.
	 * @param int   $version The schema version the patch was authored against.
	 * @return Gutenberg_View_Config_Data The instance, for chaining.
	 */
	public function update_view_list_items( array $items, int $version ) {
		if ( ! $this->check_version( $version, __METHOD__ ) ) {
			return $this;
		}

		if ( empty( $items ) ) {
			return $this;
		}
		if ( array_is_list( $items ) ) {
			_doing_it_wrong(
				__METHOD__,
				esc_html__( 'A view list patch must be keyed by view "slug".', 'gutenberg' ),
				'7.1.0'
			);
			return $this;
		}

		$view_list = isset( $this->config['view_list'] ) && is_array( $this->config['view_list'] ) ? $this->config['view_list'] : array();

		foreach ( $items as $slug => $value ) {
			// PHP casts numeric-string array keys to integers; identities are strings.
			$slug = (string) $slug;

			if ( null === $value ) {
				$view_list = array_values(
					array_filter(
						$view_list,
						static fn( $item ) => ! is_array( $item ) || ! isset( $item['slug'] ) || $item['slug'] !== $slug
					)
				);
				continue;
			}

			if ( ! is_array( $value ) || ( array() !== $value && array_is_list( $value ) ) ) {
				_doing_it_wrong(
					__METHOD__,
					esc_html__( 'Each view patch must be an associative array of view properties, or null to remove the view.', 'gutenberg' ),
					'7.1.0'
				);
				continue;
			}

			// The patch key is the identity.
			unset( $value['slug'] );

			$index = null;
			foreach ( $view_list as $i => $item ) {
				if ( is_array( $item ) && isset( $item['slug'] ) && $item['slug'] === $slug ) {
					$index = $i;
					break;
				}
			}

			if ( null === $index ) {
				$view_list[] = array_merge( array( 'slug' => $slug ), $value );
				continue;
			}
			// An empty patch value has nothing to merge (and deep_merge would
			// treat an empty array as a list, replacing the whole view).
			if ( array() !== $value ) {
				$view_list[ $index ] = $this->deep_merge( $view_list[ $index ], $value );
			}
		}

		$this->config['view_list'] = array_values( $view_list );

		return $this;
	}

	/**
	 * Validates a declared patch version, reporting misuse against the given
	 * public method.
	 *
	 * @since 7.1.0
	 *
	 * @param int    $version The declared version.
	 * @param string $method  The public method the patch was passed to.
	 * @return bool Whether the declared version is a supported schema version.
	 */
	private function check_version( int $version, $method ) {
		if ( $version >= 1 && $version <= self::LATEST_VERSION ) {
			return true;
		}

		_doing_it_wrong(
			esc_html( $method ),
			esc_html__( 'A view configuration contribution must declare a supported schema version.', 'gutenberg' ),
			'7.1.0'
		);

		return false;
	}

	/**
	 * Recursively merges two values.
	 *
	 * Associative arrays (maps) merge key by key and a null patch value deletes
	 * the key; lists and scalars are replaced wholesale by the incoming value,
	 * since lists without a defined identity cannot be merged member by member.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $current  The current value.
	 * @param mixed $incoming The incoming value.
	 * @return mixed The merged value.
	 */
	private function deep_merge( $current, $incoming ) {
		// An empty array counts as a list, so patching with array() empties
		// the key (e.g. 'filters' => array() clears the filters) rather than
		// being a no-op map merge.
		if ( ! is_array( $incoming ) || array_is_list( $incoming ) ) {
			return $incoming;
		}

		// Merge onto the current map, or onto an empty base when the current
		// value is absent, empty, or not a map, so null delete-markers in the
		// patch are consumed rather than stored as literal values (e.g.
		// array( 'layout' => null ) merged into an empty layouts entry yields
		// array(), not array( 'layout' => null )).
		$result = is_array( $current ) && ! array_is_list( $current ) ? $current : array();
		foreach ( $incoming as $key => $value ) {
			if ( null === $value ) {
				// A null patch value deletes the key.
				unset( $result[ $key ] );
				continue;
			}
			$result[ $key ] = $this->deep_merge(
				array_key_exists( $key, $result ) ? $result[ $key ] : array(),
				$value
			);
		}
		return $result;
	}

	/**
	 * Merges a `default_view`, `default_layouts`, or `form` value, treating
	 * numerically indexed arrays (lists) as collections merged by identity.
	 *
	 * Unlike deep_merge(), which replaces a list wholesale, this recurses
	 * through maps and merges lists element by element: a member whose identity
	 * (a scalar's own value, or a map's `id`/`slug`/`field`/`name`) matches an
	 * existing member merges into it in place — recursively by these same rules,
	 * so a list nested inside a member merges by identity too — and an unmatched
	 * member is appended. Members without an identity (e.g. nested lists) are
	 * always appended, so a list of such values grows rather than replacing.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $current  The current value.
	 * @param mixed $incoming The incoming value.
	 * @return mixed The merged value.
	 */
	private function merge_properties( $current, $incoming ) {
		if ( ! is_array( $incoming ) ) {
			return $incoming;
		}

		if ( array_is_list( $incoming ) ) {
			return $this->merge_list_by_identity(
				is_array( $current ) && array_is_list( $current ) ? $current : array(),
				$incoming
			);
		}

		// Merge onto the current map, or onto an empty base when the current
		// value is absent, empty, or not a map, so null delete-markers in the
		// patch are consumed rather than stored as literal values.
		$result = is_array( $current ) && ! array_is_list( $current ) ? $current : array();
		foreach ( $incoming as $key => $value ) {
			if ( null === $value ) {
				// A null patch value deletes the key.
				unset( $result[ $key ] );
				continue;
			}
			$result[ $key ] = $this->merge_properties(
				array_key_exists( $key, $result ) ? $result[ $key ] : array(),
				$value
			);
		}
		return $result;
	}

	/**
	 * Merges an incoming list into the current one by member identity.
	 *
	 * A member of the incoming list whose identity matches one already present
	 * merges into it in place, keeping its position; an unmatched member is
	 * appended to the end. A matched member's contents merge recursively with
	 * the same rules (merge_properties), so the identity-aware merge applies at
	 * any nesting level: each key named by the patch is substituted while the
	 * others are left intact, and a list nested inside a member merges by
	 * identity just like the list it lives in.
	 *
	 * @since 7.1.0
	 *
	 * @param array $current  The current list.
	 * @param array $incoming The incoming list.
	 * @return array The merged list.
	 */
	private function merge_list_by_identity( array $current, array $incoming ) {
		$result = $current;
		foreach ( $incoming as $item ) {
			$identity = $this->list_item_identity( $item );

			$index = null;
			if ( null !== $identity ) {
				foreach ( $result as $i => $existing ) {
					if ( $this->list_item_identity( $existing ) === $identity ) {
						$index = $i;
						break;
					}
				}
			}

			if ( null === $index ) {
				$result[] = $item;
				continue;
			}
			$result[ $index ] = $this->merge_properties( $result[ $index ], $item );
		}

		return $result;
	}

	/**
	 * Resolves the identity used to match a list member against another.
	 *
	 * A bare scalar is shorthand for a member referenced by its `id`, so it
	 * shares an identity with a map carrying that same `id` (this is how a
	 * bare field like `'f3'` and a `array( 'id' => 'f3' )` patch match). A map
	 * is otherwise identified by the first of the well-known identity keys it
	 * carries. Anything else (e.g. a nested list) has no identity and never
	 * matches, so it is always appended.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $item The list member.
	 * @return mixed The identity, or null when the member has none.
	 */
	private function list_item_identity( $item ) {
		if ( is_scalar( $item ) ) {
			return 'id:' . $item;
		}
		if ( is_array( $item ) && ! array_is_list( $item ) ) {
			foreach ( array( 'id', 'slug', 'field', 'name' ) as $key ) {
				if ( isset( $item[ $key ] ) && is_scalar( $item[ $key ] ) ) {
					return $key . ':' . $item[ $key ];
				}
			}
		}
		return null;
	}
}
