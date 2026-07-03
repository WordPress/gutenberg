<?php
/**
 * Gutenberg_View_Config_Data class
 *
 * @package gutenberg
 */

/**
 * Mutable container passed through the `get_entity_view_config_{$kind}_{$name}`
 * filter so core and third parties can contribute to an entity's view
 * configuration as versioned patches instead of mutating a raw array.
 *
 * Two kinds of contribution are supported:
 *
 * - Base definition (`set()`): replaces a whole top-level key. Intended for the
 *   entity's authoritative definition (core's per-post-type callbacks). Because
 *   it replaces rather than merges, a third party using it stops inheriting
 *   core's future changes to that key (a "freeze"), so third parties should
 *   prefer the layering functions below.
 * - Versioned layering: additive patches that survive future shape changes.
 *   Each contribution declares the schema version it was authored against so it
 *   can be migrated forward to the latest version before it merges, and each
 *   function covers one part of the configuration. `update_properties()` merges the
 *   object-shaped keys: `default_view`, `default_layouts`, and `form` minus its
 *   `fields`. `update_view_list_items()` patches `view_list` entries by `slug`,
 *   and `update_form_fields()` patches `form` fields by `id`, finding a field
 *   wherever it lives — at the top level or nested in a group's `children`.
 *   All the update functions follow the same rules: a map value merges key by key, a list
 *   value replaces wholesale, and `null` deletes what it names — a property, a
 *   whole member, or a whole top-level key, which
 *   `gutenberg_get_entity_view_config()` backfills from the defaults so it
 *   reads as a reset.
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
	 * Intended for the entity's base definition (core's per-post-type callbacks).
	 * Third parties should prefer the update_* functions so they keep inheriting
	 * core's future changes.
	 *
	 * @since 7.1.0
	 *
	 * @param string $key   The configuration key to replace.
	 * @param mixed  $value The new value.
	 * @return Gutenberg_View_Config_Data The instance, for chaining.
	 */
	public function set( $key, $value ) {
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
	 * Merges a versioned patch into the object-shaped configuration keys.
	 *
	 * Covers `default_view`, `default_layouts`, and `form` except its `fields`.
	 * A map value merges key by key, a list value replaces wholesale, and a
	 * `null` value deletes the key it names: a nested value (a `default_view`
	 * property, a `default_layouts` entry or nested layout property) is unset,
	 * and a whole top-level key — any documented key, including `view_list` —
	 * is dropped from the container. `gutenberg_get_entity_view_config()`
	 * backfills a dropped documented key from the defaults, so that reads as a
	 * reset.
	 *
	 * The identity-keyed collections are managed by their own functions and are
	 * rejected here: a non-null `view_list` value must go through
	 * `update_view_list_items()`, and a `fields` key inside a `form` value must
	 * go through `update_form_fields()`.
	 *
	 * A patch whose version is missing or outside `[1, LATEST_VERSION]` is
	 * rejected (it cannot be migrated) and does not merge.
	 *
	 * @since 7.1.0
	 *
	 * @param array    $patch   The partial configuration to merge.
	 * @param int|null $version The schema version the patch was authored against.
	 * @return Gutenberg_View_Config_Data The instance, for chaining.
	 */
	public function update_properties( array $patch, $version = null ) {
		if ( ! $this->check_version( $version, __METHOD__ ) ) {
			return $this;
		}

		$patch = $this->migrate( $patch, $version, 'properties' );

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
				$value = $this->extract_form_properties( $value );
				// Nothing left to merge: the value was off-shape, or held only
				// the rejected `fields` key.
				if ( null === $value || array() === $value ) {
					continue;
				}
			}
			// A documented key that is not yet present merges onto an empty base.
			$current              = array_key_exists( $key, $this->config ) ? $this->config[ $key ] : array();
			$this->config[ $key ] = $this->deep_merge( $current, $value );
		}

		return $this;
	}

	/**
	 * Merges a versioned patch into the `view_list`, keyed by `slug`.
	 *
	 * Each patch key names the `slug` of the view it patches: a matching view
	 * merges in place and keeps its position (a map value merges key by key, a
	 * list value — e.g. the view's `filters` — replaces wholesale), an unknown
	 * slug appends a new view to the end, and a `null` value removes the view.
	 * The patch key is the identity: a `slug` property inside the value is
	 * ignored. A `null` for a slug that is not found is a silent no-op: the
	 * view may have been removed by another filter or simply not apply to this
	 * entity, which is a legitimate outcome rather than misuse.
	 *
	 * A patch whose version is missing or outside `[1, LATEST_VERSION]` is
	 * rejected (it cannot be migrated) and does not merge.
	 *
	 * @since 7.1.0
	 *
	 * @param array    $items   The view patches, keyed by slug.
	 * @param int|null $version The schema version the patch was authored against.
	 * @return Gutenberg_View_Config_Data The instance, for chaining.
	 */
	public function update_view_list_items( array $items, $version = null ) {
		if ( ! $this->check_version( $version, __METHOD__ ) ) {
			return $this;
		}

		$items = $this->migrate( $items, $version, 'view_list' );

		if ( array() === $items ) {
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
						static function ( $item ) use ( $slug ) {
							return ! is_array( $item ) || ! isset( $item['slug'] ) || $item['slug'] !== $slug;
						}
					)
				);
				continue;
			}

			if ( ! is_array( $value ) || ( array() !== $value && array_is_list( $value ) ) ) {
				_doing_it_wrong(
					__METHOD__,
					esc_html__( 'Each view patch must be an object of view properties, or null to remove the view.', 'gutenberg' ),
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
	 * Merges a versioned patch into the `form` fields, keyed by field `id`.
	 *
	 * Each patch key names the `id` of the field it patches, and the field is
	 * found wherever it lives — at the top level or nested inside a group's
	 * `children`. Fields are visited in document order and a group is checked
	 * before its own children, so when an id appears at both levels the group
	 * wins. A matching field merges in place, an unknown id appends a new field
	 * to the end of the top-level list, and a `null` value removes the field.
	 * The patch key is the identity: an `id` property inside the value is
	 * ignored.
	 *
	 * Inside a field patch, `children` follows the same rules: a map merges
	 * into the group's children by id (appending unknown ones), a list replaces
	 * the children wholesale, and `null` deletes the key.
	 *
	 * A patch whose version is missing or outside `[1, LATEST_VERSION]` is
	 * rejected (it cannot be migrated) and does not merge.
	 *
	 * @since 7.1.0
	 *
	 * @param array    $fields  The field patches, keyed by field id.
	 * @param int|null $version The schema version the patch was authored against.
	 * @return Gutenberg_View_Config_Data The instance, for chaining.
	 */
	public function update_form_fields( array $fields, $version = null ) {
		if ( ! $this->check_version( $version, __METHOD__ ) ) {
			return $this;
		}

		$fields = $this->migrate( $fields, $version, 'form_fields' );

		if ( array() === $fields ) {
			return $this;
		}
		if ( array_is_list( $fields ) ) {
			_doing_it_wrong(
				__METHOD__,
				esc_html__( 'A fields patch must be keyed by field "id".', 'gutenberg' ),
				'7.1.0'
			);
			return $this;
		}

		if ( ! isset( $this->config['form'] ) || ! is_array( $this->config['form'] ) ) {
			$this->config['form'] = array();
		}
		$current = isset( $this->config['form']['fields'] ) && is_array( $this->config['form']['fields'] ) ? $this->config['form']['fields'] : array();

		$this->config['form']['fields'] = $this->merge_fields_by_identity( $current, $fields );

		return $this;
	}

	/**
	 * Migrates a patch from its declared version up to the latest version.
	 *
	 * The latest version is the only version so far, so this is an identity
	 * transform for now. Version-specific steps dispatch on the declared
	 * version and the part of the configuration the patch targets as the
	 * schema evolves.
	 *
	 * @since 7.1.0
	 *
	 * @param array  $patch   The patch to migrate.
	 * @param int    $version The schema version the patch was authored against.
	 * @param string $scope   The part of the configuration the patch targets: 'properties', 'view_list', or 'form_fields'.
	 * @return array The migrated patch.
	 */
	private function migrate( array $patch, $version, $scope ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $patch;
	}

	/**
	 * Validates a declared patch version, reporting misuse against the given
	 * public method.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed  $version The declared version.
	 * @param string $method  The public method the patch was passed to.
	 * @return bool Whether the version can be migrated to the latest version.
	 */
	private function check_version( $version, $method ) {
		if ( is_int( $version ) && $version >= 1 && $version <= self::LATEST_VERSION ) {
			return true;
		}

		if ( self::LATEST_VERSION > 1 ) {
			$message = sprintf(
				/* translators: %d: the latest supported version. */
				esc_html__( 'A view configuration contribution must declare a version between 1 and %d.', 'gutenberg' ),
				self::LATEST_VERSION
			);
		} else {
			$message = esc_html__( 'A view configuration contribution must declare version 1.', 'gutenberg' );
		}
		_doing_it_wrong( esc_html( $method ), $message, '7.1.0' );

		return false;
	}

	/**
	 * Validates a `form` patch value for update_properties() and strips the
	 * `fields` key, which is managed by update_form_fields().
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $value The incoming `form` patch value.
	 * @return array|null The form properties to merge, or null when the value
	 *                    is off-shape.
	 */
	private function extract_form_properties( $value ) {
		if ( ! is_array( $value ) || ( array() !== $value && array_is_list( $value ) ) ) {
			_doing_it_wrong(
				'Gutenberg_View_Config_Data::update_properties',
				esc_html__( 'A "form" patch must be an object of form properties, not a list.', 'gutenberg' ),
				'7.1.0'
			);
			return null;
		}
		if ( array_key_exists( 'fields', $value ) ) {
			_doing_it_wrong(
				'Gutenberg_View_Config_Data::update_properties',
				esc_html__( 'The form "fields" are patched by identity. Use update_form_fields() instead.', 'gutenberg' ),
				'7.1.0'
			);
			unset( $value['fields'] );
		}

		return $value;
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
		// Only a map patch merges; scalars and lists replace wholesale. An
		// empty array counts as a list, so patching with array() empties the
		// key (e.g. 'filters' => array() clears the filters) rather than
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
	 * Merges a map of field patches into a field list by identity.
	 *
	 * Shared by the top-level `form` fields and a group's `children`: a `null`
	 * value removes the matching field (recursing into children), a map value
	 * merges into the matching field wherever it lives, and an unknown id
	 * appends a new field to the end of this list. A `null` for an id that is
	 * not found is a silent no-op: the field may have been removed by another
	 * filter or simply not apply to this entity, which is a legitimate outcome
	 * rather than misuse.
	 *
	 * @since 7.1.0
	 *
	 * @param array $current The current list of fields.
	 * @param array $patches The field patches, keyed by field id.
	 * @return array The merged list of fields.
	 */
	private function merge_fields_by_identity( array $current, array $patches ) {
		foreach ( $patches as $id => $value ) {
			// PHP casts numeric-string array keys to integers; identities are strings.
			$id = (string) $id;

			if ( null === $value ) {
				$current = $this->reject_fields( $current, array( $id ) );
				continue;
			}
			if ( ! is_array( $value ) || ( array() !== $value && array_is_list( $value ) ) ) {
				_doing_it_wrong(
					'Gutenberg_View_Config_Data::update_form_fields',
					esc_html__( 'Each field patch must be an object of field properties, or null to remove the field.', 'gutenberg' ),
					'7.1.0'
				);
				continue;
			}

			// The patch key is the identity.
			unset( $value['id'] );

			$merged = $this->merge_field_in_tree( $current, $id, $value );
			if ( null !== $merged ) {
				$current = $merged;
				continue;
			}
			// An unknown id appends: as a bare string reference when the patch
			// carries no overrides, as an object otherwise.
			$current[] = array() === $value ? $id : $this->merge_field_item( $id, $id, $value );
		}

		return $current;
	}

	/**
	 * Merges a field patch into the field carrying the given identity, wherever
	 * it lives in the tree.
	 *
	 * Fields are visited in document order and a group is checked before its
	 * own children, so when an id appears at both levels the group wins.
	 *
	 * @since 7.1.0
	 *
	 * @param array  $fields The list of fields to search.
	 * @param string $id     The identity of the field to patch.
	 * @param array  $value  The field patch.
	 * @return array|null The updated list, or null when the id was not found.
	 */
	private function merge_field_in_tree( array $fields, $id, array $value ) {
		foreach ( $fields as $index => $field ) {
			if ( $this->field_identity( $field ) === $id ) {
				$fields[ $index ] = $this->merge_field_item( $field, $id, $value );
				return $fields;
			}
			if ( is_array( $field ) && isset( $field['children'] ) && is_array( $field['children'] ) ) {
				$children = $this->merge_field_in_tree( $field['children'], $id, $value );
				if ( null !== $children ) {
					$fields[ $index ]['children'] = $children;
					return $fields;
				}
			}
		}

		return null;
	}

	/**
	 * Merges a field patch into an existing field.
	 *
	 * A bare string reference is promoted to an object so the overrides apply.
	 * The `children` key follows the same rules — a map merges into the
	 * group's children by id, a list replaces them wholesale, and `null`
	 * deletes the key — and every other key merges as a value: a map merges
	 * key by key, a list or scalar replaces, and `null` deletes the key.
	 *
	 * @since 7.1.0
	 *
	 * @param array|string $existing The existing field.
	 * @param string       $id       The field identity.
	 * @param array        $value    The field patch.
	 * @return array|string The merged field.
	 */
	private function merge_field_item( $existing, $id, array $value ) {
		if ( ! is_array( $existing ) ) {
			// Nothing to apply: keep the bare string reference.
			if ( array() === $value ) {
				return $existing;
			}
			// Promote the reference so the incoming overrides apply.
			$existing = array( 'id' => $id );
		}

		foreach ( $value as $key => $item ) {
			if ( 'children' === $key ) {
				if ( null === $item ) {
					unset( $existing['children'] );
					continue;
				}
				if ( ! is_array( $item ) ) {
					_doing_it_wrong(
						'Gutenberg_View_Config_Data::update_form_fields',
						esc_html__( 'A "children" patch must be an object keyed by field id to merge, a list to replace the children wholesale, or null to delete the key.', 'gutenberg' ),
						'7.1.0'
					);
					continue;
				}
				// A list replaces the children wholesale (an empty array counts
				// as a list, clearing them)...
				if ( array_is_list( $item ) ) {
					$existing['children'] = $item;
					continue;
				}
				// ...and a map merges into them by identity.
				$children             = isset( $existing['children'] ) && is_array( $existing['children'] ) ? $existing['children'] : array();
				$existing['children'] = $this->merge_fields_by_identity( $children, $item );
				continue;
			}
			if ( null === $item ) {
				// A null patch value deletes the key.
				unset( $existing[ $key ] );
				continue;
			}
			$existing[ $key ] = $this->deep_merge(
				array_key_exists( $key, $existing ) ? $existing[ $key ] : array(),
				$item
			);
		}

		return $existing;
	}

	/**
	 * Returns a field list with the fields matching the given identities removed,
	 * recursing into group children.
	 *
	 * @since 7.1.0
	 *
	 * @param array    $fields The list of fields.
	 * @param string[] $ids    The identities of the fields to remove.
	 * @return array The list with the matching fields removed.
	 */
	private function reject_fields( array $fields, array $ids ) {
		$result = array();
		foreach ( $fields as $field ) {
			if ( in_array( $this->field_identity( $field ), $ids, true ) ) {
				continue;
			}
			if ( is_array( $field ) && isset( $field['children'] ) && is_array( $field['children'] ) ) {
				$field['children'] = $this->reject_fields( $field['children'], $ids );
			}
			$result[] = $field;
		}
		return $result;
	}

	/**
	 * Resolves the identity of a form field.
	 *
	 * A bare string is its own identity; an object is identified by its `id`.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $field The field.
	 * @return string|null The identity, or null if it cannot be resolved.
	 */
	private function field_identity( $field ) {
		if ( is_string( $field ) ) {
			return $field;
		}
		if ( is_array( $field ) && isset( $field['id'] ) && is_string( $field['id'] ) ) {
			return $field['id'];
		}
		return null;
	}
}
