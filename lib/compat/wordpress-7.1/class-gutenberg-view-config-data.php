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
 * - The `merge()` method merges partial changes (patches) into what is already
 *   there: `default_view`, `default_layouts`, and the `form` settings by key,
 *   and the `view_list` entries by view `slug` identity. This is what plugins
 *   should use: patches compose with core's configuration and with other
 *   plugins'.
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
	 * the `form` settings, and the `view_list` collection.
	 *
	 * A `view_list` patch is a list of view objects that merge into the current
	 * collection by `slug` identity: a view whose `slug` matches one already
	 * present merges into it in place and keeps its position, and one with a
	 * new `slug` is appended. The patch must be list-shaped — a map is rejected,
	 * mirroring how a `form` patch must be map-shaped. A patch that declares an
	 * unsupported schema version is also rejected.
	 *
	 * @since 7.1.0
	 *
	 * @param array $patch   The partial configuration to merge.
	 * @param int   $version The schema version the patch was authored against.
	 * @return Gutenberg_View_Config_Data The instance, for chaining.
	 */
	public function merge( array $patch, int $version ) {
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
				// The view list is a collection of view objects, each identified
				// by its `slug`; a patch must be a list, mirroring how `form`
				// must be a map. Entries then merge by slug identity below.
				if ( ! is_array( $value ) || ( array() !== $value && ! array_is_list( $value ) ) ) {
					_doing_it_wrong(
						__METHOD__,
						esc_html__( 'A "view_list" patch must be a list of view objects.', 'gutenberg' ),
						'7.1.0'
					);
					continue;
				}
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
	 * Merges a `default_view`, `default_layouts`, `form`, or `view_list` value,
	 * treating numerically indexed arrays (lists) as collections merged by
	 * identity.
	 *
	 * It recurses through maps and merges lists element by element: a member
	 * whose identity
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
