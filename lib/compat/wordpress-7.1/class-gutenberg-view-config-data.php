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
 * filter callbacks receive: a callback changes the configuration by passing a
 * versioned contribution to `update_with()` and returning the instance. The
 * contribution declares the configuration schema version it was written
 * against (currently 1), so a future WordPress release that changes the
 * configuration shape can migrate existing contributions forward instead of
 * breaking them.
 *
 * Contributions follow three shared rules: an associative array merges key by
 * key, a numerically indexed array replaces the current value wholesale, and
 * `null` deletes what it names. Deleting a whole top-level key resets it to its
 * default when the configuration is returned. The `view_list` and
 * `form.fields` lists additionally support identity-aware patches: pass an
 * associative array keyed by view `slug` or field `id` to merge, append, or
 * remove individual entries; pass a numerically indexed array to replace the
 * entire list.
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
	 * Updates the view configuration with the given versioned contribution.
	 *
	 * The contribution must include a `version` key declaring the schema
	 * version it was authored against. The documented configuration keys are
	 * `default_view`, `default_layouts`, `view_list`, and `form`.
	 *
	 * @since 7.1.0
	 *
	 * @param array $new_data The versioned configuration contribution.
	 * @return Gutenberg_View_Config_Data The instance, for chaining.
	 */
	public function update_with( array $new_data ) {
		if ( ! $this->check_version( $new_data, __METHOD__ ) ) {
			return $this;
		}

		unset( $new_data['version'] );

		foreach ( $new_data as $key => $value ) {
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

			$this->merge_config_key( $key, $value );
		}

		return $this;
	}

	/**
	 * Merges a documented top-level configuration key.
	 *
	 * @since 7.1.0
	 *
	 * @param string $key   The configuration key.
	 * @param mixed  $value The incoming value.
	 */
	private function merge_config_key( $key, $value ) {
		if ( 'view_list' === $key ) {
			$this->merge_view_list( $value );
			return;
		}

		if ( 'form' === $key ) {
			$this->merge_form( $value );
			return;
		}

		$this->config[ $key ] = $this->deep_merge( $this->config[ $key ] ?? array(), $value );
	}

	/**
	 * Merges or replaces the `view_list` configuration.
	 *
	 * A numerically indexed array replaces the full list. An associative array
	 * patches entries by view `slug`.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $value The incoming view list value.
	 */
	private function merge_view_list( $value ) {
		if ( ! is_array( $value ) ) {
			_doing_it_wrong(
				'Gutenberg_View_Config_Data::update_with',
				esc_html__( 'The "view_list" value must be an array.', 'gutenberg' ),
				'7.1.0'
			);
			return;
		}

		if ( array_is_list( $value ) ) {
			$this->config['view_list'] = $value;
			return;
		}

		$view_list                  = isset( $this->config['view_list'] ) && is_array( $this->config['view_list'] ) ? $this->config['view_list'] : array();
		$this->config['view_list'] = $this->merge_view_list_items( $view_list, $value );
	}

	/**
	 * Adds, updates, or removes `view_list` entries, keyed by view `slug`.
	 *
	 * Each patch key names the `slug` of the view it targets: a matching view
	 * merges in place and keeps its position, an unknown slug appends a new
	 * view to the end, and `null` removes the view.
	 *
	 * @since 7.1.0
	 *
	 * @param array $view_list The current view list.
	 * @param array $items     The view patches, keyed by slug.
	 * @return array The merged view list.
	 */
	private function merge_view_list_items( array $view_list, array $items ) {
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
					'Gutenberg_View_Config_Data::update_with',
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

		return array_values( $view_list );
	}

	/**
	 * Merges the `form` configuration.
	 *
	 * Form properties merge normally. The `fields` property may be a list,
	 * replacing all fields, or an associative array that patches fields by `id`.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $value The incoming form value.
	 */
	private function merge_form( $value ) {
		if ( ! is_array( $value ) || ( array() !== $value && array_is_list( $value ) ) ) {
			_doing_it_wrong(
				'Gutenberg_View_Config_Data::update_with',
				esc_html__( 'The "form" value must be an associative array of form properties.', 'gutenberg' ),
				'7.1.0'
			);
			return;
		}

		if ( array() === $value ) {
			$this->config['form'] = array();
			return;
		}

		if ( ! isset( $this->config['form'] ) || ! is_array( $this->config['form'] ) ) {
			$this->config['form'] = array();
		}

		foreach ( $value as $key => $item ) {
			if ( 'fields' === $key ) {
				$this->merge_form_fields( $item );
				continue;
			}
			if ( null === $item ) {
				unset( $this->config['form'][ $key ] );
				continue;
			}
			$this->config['form'][ $key ] = $this->deep_merge(
				array_key_exists( $key, $this->config['form'] ) ? $this->config['form'][ $key ] : array(),
				$item
			);
		}
	}

	/**
	 * Merges or replaces the `form.fields` list.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $fields The incoming fields value.
	 */
	private function merge_form_fields( $fields ) {
		if ( null === $fields ) {
			unset( $this->config['form']['fields'] );
			return;
		}
		if ( ! is_array( $fields ) ) {
			_doing_it_wrong(
				'Gutenberg_View_Config_Data::update_with',
				esc_html__( 'The form "fields" value must be an array or null.', 'gutenberg' ),
				'7.1.0'
			);
			return;
		}

		if ( array_is_list( $fields ) ) {
			$this->config['form']['fields'] = $fields;
			return;
		}

		$current                        = isset( $this->config['form']['fields'] ) && is_array( $this->config['form']['fields'] ) ? $this->config['form']['fields'] : array();
		$this->config['form']['fields'] = $this->merge_fields_by_identity( $current, $fields );
	}

	/**
	 * Validates a declared contribution version, reporting misuse against the given
	 * public method.
	 *
	 * @since 7.1.0
	 *
	 * @param array  $new_data The incoming contribution.
	 * @param string $method   The public method the contribution was passed to.
	 * @return bool Whether the declared version is a supported schema version.
	 */
	private function check_version( array $new_data, $method ) {
		if ( ! array_key_exists( 'version', $new_data ) || ! is_int( $new_data['version'] ) ) {
			_doing_it_wrong(
				esc_html( $method ),
				esc_html__( 'A view configuration contribution must declare a supported schema version.', 'gutenberg' ),
				'7.1.0'
			);

			return false;
		}

		$version = $new_data['version'];
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
	 * Merges a map of field patches into a field list by identity.
	 *
	 * Shared by the top-level `form` fields and a group's `children`: a `null`
	 * value removes the matching field (recursing into children), a map value
	 * merges into the matching field wherever it lives, and an unknown id
	 * appends a new field to the end of this list. A `null` for an id that is
	 * not found is a silent no-op.
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
					'Gutenberg_View_Config_Data::update_with',
					esc_html__( 'Each field patch must be an associative array of field properties, or null to remove the field.', 'gutenberg' ),
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
			// carries no overrides, as an array otherwise.
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
	 * A bare string reference is promoted to an array so the overrides apply.
	 * The `children` key follows the same rules — a map merges into the
	 * group's children by id, a list replaces them wholesale, and `null`
	 * deletes the key — and every other key merges via deep_merge().
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
						'Gutenberg_View_Config_Data::update_with',
						esc_html__( 'A "children" patch must be an associative array keyed by field id to merge, a numerically indexed array to replace the children wholesale, or null to delete the key.', 'gutenberg' ),
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
