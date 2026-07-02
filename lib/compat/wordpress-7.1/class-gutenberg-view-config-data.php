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
 *   prefer the layering verbs below.
 * - Versioned layering (`update_with()` and the `remove_*` helpers): additive
 *   patches that survive future shape changes. Each `update_with()` contribution
 *   declares the schema version it was authored against and is migrated forward
 *   to the latest version before it merges: identity-keyed lists (`view_list` by
 *   `slug`, `form` fields by `id`) merge a matching member in place and append an
 *   unknown one to the end; the object-shaped keys (`default_view`,
 *   `default_layouts`) merge recursively; and a patch value of `null` deletes
 *   that key (e.g. a nested layout property or a field's `label`). Dropping a
 *   whole list member instead
 *   goes through `remove_view_list_items()` (by `slug`) and `remove_fields()`
 *   (by `id`, recursing into group `children`): they name identities and core
 *   walks its own current structure to drop them, which keeps inheritance intact
 *   and version-safe.
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
	 * Third parties should prefer update_with() and the remove_* helpers so they
	 * keep inheriting core's future changes.
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
	 * Merges a versioned patch into the configuration.
	 *
	 * The patch is migrated from the declared version up to the latest version
	 * and then merged by identity: matching collection members merge in place and
	 * unknown ones append to the end. A patch value of `null` deletes that key
	 * rather than assigning `null`: a nested value (a `default_view` property, a
	 * `default_layouts` entry or nested layout property, a field's `label`) is
	 * unset, and a whole top-level key is dropped from the container —
	 * `gutenberg_get_entity_view_config()` backfills a dropped documented key
	 * from the defaults, so that reads as a reset. Null never removes list
	 * content: a `null` inside a list member is kept as a literal value, and
	 * nulling the `fields`/`children` lists themselves is rejected; use
	 * `remove_view_list_items()` / `remove_fields()` to drop list members.
	 *
	 * A patch whose version is missing or outside `[1, LATEST_VERSION]` is rejected
	 * (it cannot be migrated) and does not merge.
	 *
	 * @since 7.1.0
	 *
	 * @param array    $patch   The partial configuration to merge.
	 * @param int|null $version The schema version the patch was authored against.
	 * @return Gutenberg_View_Config_Data The instance, for chaining.
	 */
	public function update_with( array $patch, $version = null ) {
		if ( ! $this->is_valid_version( $version ) ) {
			if ( self::LATEST_VERSION > 1 ) {
				$message = sprintf(
					/* translators: %d: the latest supported version. */
					esc_html__( 'A view configuration contribution must declare a version between 1 and %d.', 'gutenberg' ),
					self::LATEST_VERSION
				);
			} else {
				$message = esc_html__( 'A view configuration contribution must declare version 1.', 'gutenberg' );
			}
			_doing_it_wrong( __METHOD__, $message, '7.1.0' );
			return $this;
		}

		$patch = $this->migrate( $patch );

		foreach ( $patch as $key => $value ) {
			// Keys outside the documented shape are discarded, so the container
			// only ever exposes the documented keys.
			if ( ! in_array( $key, self::CONFIG_KEYS, true ) ) {
				continue;
			}
			// A null patch value drops the whole key from the container rather
			// than assigning null.
			if ( null === $value ) {
				unset( $this->config[ $key ] );
				continue;
			}
			// A documented key that is not yet present merges onto an empty base.
			$current              = array_key_exists( $key, $this->config ) ? $this->config[ $key ] : array();
			$this->config[ $key ] = $this->merge_value( $key, $current, $value );
		}

		return $this;
	}

	/**
	 * Removes one or more `view_list` entries by `slug`.
	 *
	 * Core walks its own current view list to drop the named entries, so the
	 * caller only needs the stable slug.
	 *
	 * An entry that is not found is left untouched without warning: it may have
	 * been removed by another filter or simply not apply to this entity, which is
	 * a legitimate outcome rather than misuse.
	 *
	 * @since 7.1.0
	 *
	 * @param string|string[] $slugs A single slug to remove, or an array of slugs.
	 * @return Gutenberg_View_Config_Data The instance, for chaining.
	 */
	public function remove_view_list_items( $slugs ) {
		$slugs = (array) $slugs;

		if ( isset( $this->config['view_list'] ) && is_array( $this->config['view_list'] ) ) {
			$this->config['view_list'] = array_values(
				array_filter(
					$this->config['view_list'],
					static function ( $item ) use ( $slugs ) {
						$slug = is_array( $item ) && isset( $item['slug'] ) ? $item['slug'] : null;
						return ! in_array( $slug, $slugs, true );
					}
				)
			);
		}

		return $this;
	}

	/**
	 * Removes one or more `form` fields by `id`, recursing into group children.
	 *
	 * Core walks its own current form structure to find and drop the named
	 * fields, including ones nested inside a group's `children`, so the caller
	 * only needs the stable id.
	 *
	 * A field that is not found is left untouched without warning: it may have
	 * been removed by another filter or simply not apply to this entity, which is
	 * a legitimate outcome rather than misuse.
	 *
	 * @since 7.1.0
	 *
	 * @param string|string[] $ids A single field id to remove, or an array of ids.
	 * @return Gutenberg_View_Config_Data The instance, for chaining.
	 */
	public function remove_fields( $ids ) {
		$ids = (array) $ids;

		if ( isset( $this->config['form']['fields'] ) && is_array( $this->config['form']['fields'] ) ) {
			$this->config['form']['fields'] = $this->reject_fields( $this->config['form']['fields'], $ids );
		}

		return $this;
	}

	/**
	 * Migrates a patch up to the latest version.
	 *
	 * The latest version is the only version so far, so this is an identity
	 * transform for now. Version-specific steps — and the source version they
	 * migrate from — are added here as the schema evolves.
	 *
	 * @since 7.1.0
	 *
	 * @param array $patch The patch to migrate.
	 * @return array The migrated patch.
	 */
	private function migrate( array $patch ) {
		return $patch;
	}

	/**
	 * Determines whether a declared version can be migrated to the latest version.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $version The declared version.
	 * @return bool Whether the version is a supported integer.
	 */
	private function is_valid_version( $version ) {
		return is_int( $version )
			&& $version >= 1
			&& $version <= self::LATEST_VERSION;
	}

	/**
	 * Merges an incoming value for a top-level key into the current value.
	 *
	 * Dispatches the identity-keyed collections to their dedicated mergers and
	 * falls back to a recursive value merge for object-shaped keys.
	 *
	 * @since 7.1.0
	 *
	 * @param string $key      The top-level key being merged.
	 * @param mixed  $current  The current value.
	 * @param mixed  $incoming The incoming value.
	 * @return mixed The merged value.
	 */
	private function merge_value( $key, $current, $incoming ) {
		if ( 'view_list' === $key ) {
			return $this->merge_view_list( $current, $incoming );
		}
		if ( 'form' === $key ) {
			return $this->merge_form( $current, $incoming );
		}
		return $this->deep_merge( $current, $incoming );
	}

	/**
	 * Recursively merges two values.
	 *
	 * Associative arrays (maps) merge key by key; lists and scalars are replaced
	 * wholesale by the incoming value, since lists without a defined identity
	 * cannot be merged member by member.
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
	 * Merges an incoming view list into the current one, keyed by `slug`.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $current  The current view list.
	 * @param mixed $incoming The incoming view list.
	 * @return mixed The merged view list.
	 */
	private function merge_view_list( $current, $incoming ) {
		if ( ! is_array( $incoming ) || ! array_is_list( $incoming ) ) {
			_doing_it_wrong(
				'Gutenberg_View_Config_Data::update_with',
				esc_html__( 'A "view_list" patch must be a list of view objects.', 'gutenberg' ),
				'7.1.0'
			);
			return $current;
		}
		if ( ! is_array( $current ) ) {
			$current = array();
		}

		$result  = $current;
		$by_slug = array();
		foreach ( $result as $index => $item ) {
			if ( is_array( $item ) && isset( $item['slug'] ) ) {
				$by_slug[ $item['slug'] ] = $index;
			}
		}

		foreach ( $incoming as $item ) {
			// A member without a slug could never be matched, merged, or
			// removed afterwards, so it is rejected rather than appended.
			$slug = is_array( $item ) && isset( $item['slug'] ) ? $item['slug'] : null;
			if ( null === $slug ) {
				_doing_it_wrong(
					'Gutenberg_View_Config_Data::update_with',
					esc_html__( 'Each view in a "view_list" patch must declare a "slug".', 'gutenberg' ),
					'7.1.0'
				);
				continue;
			}
			if ( isset( $by_slug[ $slug ] ) ) {
				$index            = $by_slug[ $slug ];
				$result[ $index ] = $this->deep_merge( $result[ $index ], $item );
			} else {
				$result[]         = $item;
				$by_slug[ $slug ] = array_key_last( $result );
			}
		}

		return array_values( $result );
	}

	/**
	 * Merges an incoming form into the current one.
	 *
	 * The `fields` list is merged by field identity; every other key (e.g.
	 * `layout`) is merged recursively as a value.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $current  The current form.
	 * @param mixed $incoming The incoming form.
	 * @return mixed The merged form.
	 */
	private function merge_form( $current, $incoming ) {
		if ( ! is_array( $incoming ) || ( array() !== $incoming && array_is_list( $incoming ) ) ) {
			_doing_it_wrong(
				'Gutenberg_View_Config_Data::update_with',
				esc_html__( 'A "form" patch must be an object of form properties, not a list.', 'gutenberg' ),
				'7.1.0'
			);
			return $current;
		}
		if ( ! is_array( $current ) ) {
			$current = array();
		}

		return $this->merge_map( $current, $incoming, 'fields' );
	}

	/**
	 * Merges an incoming map into the current one, routing one identity-keyed
	 * field list key to the field-list merger.
	 *
	 * Shared by the `form` key (whose `fields` are an identity-keyed list) and
	 * a single field (whose `children` are). Every other key merges recursively
	 * as a value, and a null patch value deletes the key — except the identity
	 * list itself, whose content only `remove_fields()` may remove.
	 *
	 * @since 7.1.0
	 *
	 * @param array  $current  The current map.
	 * @param array  $incoming The incoming map patch.
	 * @param string $list_key The key holding the identity-keyed field list.
	 * @return array The merged map.
	 */
	private function merge_map( array $current, array $incoming, $list_key ) {
		$result = $current;
		foreach ( $incoming as $key => $value ) {
			if ( $list_key === $key ) {
				// The identity-keyed list cannot be deleted with null: that
				// would drop list members without naming them, which is what
				// remove_fields() is for.
				if ( null === $value ) {
					_doing_it_wrong(
						'Gutenberg_View_Config_Data::update_with',
						sprintf(
							/* translators: %s: the patch key holding the field list. */
							esc_html__( 'The "%s" list cannot be deleted with a null patch value. Use remove_fields() to remove fields.', 'gutenberg' ),
							esc_html( $list_key )
						),
						'7.1.0'
					);
					continue;
				}
				$current_list   = isset( $result[ $key ] ) && is_array( $result[ $key ] ) ? $result[ $key ] : array();
				$result[ $key ] = $this->merge_field_list( $current_list, $value );
				continue;
			}
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
	 * Merges an incoming list of form fields into the current one, keyed by `id`.
	 *
	 * A field whose identity matches an existing one merges in place; an unknown
	 * one appends to the end.
	 *
	 * @since 7.1.0
	 *
	 * @param array $current  The current list of fields.
	 * @param mixed $incoming The incoming list of fields.
	 * @return mixed The merged list of fields.
	 */
	private function merge_field_list( $current, $incoming ) {
		if ( ! is_array( $incoming ) || ! array_is_list( $incoming ) ) {
			_doing_it_wrong(
				'Gutenberg_View_Config_Data::update_with',
				esc_html__( 'A fields patch must be a list of fields.', 'gutenberg' ),
				'7.1.0'
			);
			return $current;
		}

		$result = $current;
		$by_id  = array();
		foreach ( $result as $index => $field ) {
			$identity = $this->field_identity( $field );
			if ( null !== $identity ) {
				$by_id[ $identity ] = $index;
			}
		}

		foreach ( $incoming as $field ) {
			// A field without an identity could never be matched, merged, or
			// removed afterwards, so it is rejected rather than appended.
			$identity = $this->field_identity( $field );
			if ( null === $identity ) {
				_doing_it_wrong(
					'Gutenberg_View_Config_Data::update_with',
					esc_html__( 'Each field in a patch must be a string reference or declare a string "id".', 'gutenberg' ),
					'7.1.0'
				);
				continue;
			}
			if ( isset( $by_id[ $identity ] ) ) {
				$index            = $by_id[ $identity ];
				$result[ $index ] = $this->merge_field_item( $result[ $index ], $field );
			} else {
				$result[]           = $field;
				$by_id[ $identity ] = array_key_last( $result );
			}
		}

		return array_values( $result );
	}

	/**
	 * Merges an incoming form field into an existing one.
	 *
	 * A field may be a bare string (a reference with no overrides) or an object.
	 * The nested `children` list is merged by identity like any field list.
	 *
	 * @since 7.1.0
	 *
	 * @param mixed $existing The existing field.
	 * @param mixed $incoming The incoming field.
	 * @return mixed The merged field.
	 */
	private function merge_field_item( $existing, $incoming ) {
		// A bare string reference carries no overrides, so the richer existing
		// definition wins.
		if ( ! is_array( $incoming ) ) {
			return $existing;
		}
		// Promote a bare string reference so the incoming object's overrides apply.
		if ( ! is_array( $existing ) ) {
			$existing = array( 'id' => $existing );
		}

		return $this->merge_map( $existing, $incoming, 'children' );
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
