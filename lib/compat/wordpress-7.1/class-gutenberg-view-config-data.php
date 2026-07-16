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
 * - `replace()` replaces a whole top-level key. It shouldn't be the default
 *   choice — a callback using it stops inheriting core's future changes to
 *   that key — but it's useful for cases like a post type that doesn't
 *   want the default form at all.
 *
 * Patches follow three shared rules: an associative array merges key by
 * key, a numerically indexed array replaces the current value wholesale,
 * and `null` deletes what it names — deleting a whole top-level key resets
 * it to its default. Each patch and each `replace()` value also declares the
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
	public function get_data() {
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
	public function replace( $key, $value, int $version ) {
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
	 * Merges a partial configuration into the existing.
	 *
	 * Scalar values replace the current value,
	 * associative arrays merge key by key,
	 * and numerical indexed arrays merge by member identity.
	 * Identity is determined by finding a key (`id`, `slug`, `field`, `name`) within the item.
	 * A member with no identity is always appended to the end of the list.
	 *
	 * For example, given this patch:
	 *
	 * ```php
	 * array(
	 *   'default_view' => array( 'search' => 'new search', 'fields' => array( 'newField' ) )
	 *   'default_layouts' => array( 'grid' => array( 'layout' => array( 'badgeFields' => array( 'newField' ) ) ) ),
	 *   'view_list' => array( array( 'slug' => 'table', 'title' => 'New title' ) )
	 * )
	 * ```
	 *
	 * - default_view will be updated so the search string is 'new search' and the newField is appened to the list of fields.
	 * - default_layouts will be updated so that newField is appended to the badgeFields.
	 * - view_list will be updated so that the view with slug 'table' has its title changed to 'New title'.
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

			// A null patch value drops the property.
			if ( null === $value ) {
				unset( $this->config[ $key ] );
				continue;
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
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $current  The current value.
	 * @param mixed $incoming The incoming value.
	 * @return mixed The merged value.
	 */
	private function merge_properties( $current, $incoming ) {
		// Scalar properties are merged as-is.
		if ( ! is_array( $incoming ) ) {
			return $incoming;
		}

		// Numerical indexed arrays are expected to be lists (sequential integer keys starting at 0).
		if ( array_is_list( $incoming ) ) {
			return $this->merge_list_by_identity(
				is_array( $current ) && array_is_list( $current ) ? $current : array(),
				$incoming
			);
		}

		// Consider any other array as associative (keys are strings).
		$result = is_array( $current ) && ! array_is_list( $current ) ? $current : array();
		foreach ( $incoming as $key => $value ) {
			// A null patch value deletes the property.
			if ( null === $value ) {
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

			// Find the index of the existing member with the same identity, if any.
			// If there's none, append the incoming member to the end of the list.
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

			// Otherwise, merge the incoming member into the existing one in place.
			$result[ $index ] = $this->merge_properties( $result[ $index ], $item );
		}

		return $result;
	}

	/**
	 * Resolves the identity used to match a list member against another.
	 *
	 * The identity is simply the member's value cast to a string, regardless of
	 * which key carries it: a bare scalar is its own identity, and a map is
	 * identified by the value of the first of the well-known identity keys
	 * (`id`, `slug`, `field`, `name`) it carries. Because the key is not part of
	 * the identity, a bare field like `'f3'` matches any map carrying that
	 * value, whether it appears as `array( 'id' => 'f3' )`,
	 * `array( 'slug' => 'f3' )`, and so on — this lets the same shorthand target
	 * lists keyed by different fields. Casting to string keeps numeric
	 * identities matching whether they arrive as an int or a string. Anything
	 * else (e.g. a nested list) has no identity and never matches, so it is
	 * always appended.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $item The list member.
	 * @return string|null The identity, or null when the member has none.
	 */
	private function list_item_identity( $item ) {
		if ( is_scalar( $item ) ) {
			return (string) $item;
		}

		if ( is_array( $item ) && ! array_is_list( $item ) ) {
			foreach ( array( 'id', 'slug', 'field' ) as $key ) {
				if ( isset( $item[ $key ] ) && is_scalar( $item[ $key ] ) ) {
					return (string) $item[ $key ];
				}
			}
		}

		return null;
	}
}
