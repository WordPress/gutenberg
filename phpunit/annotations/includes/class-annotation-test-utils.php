<?php
/**
 * Annotation Test Utilities
 *
 * @package gutenberg
 */

/**
 * Annotation test utilities.
 */
class Annotation_Test_Utils {
	/**
	 * Test case.
	 *
	 * @var WP_UnitTestCase
	 */
	protected $case;

	/**
	 * Roles + anonymous.
	 *
	 * @var string[]
	 */
	public $roles = array(
		'administrator',
		'editor',
		'author',
		'contributor',
		'subscriber',
		'anonymous',
	);

	/**
	 * Standard meta-caps.
	 *
	 * @var string[]
	 */
	public $standard_meta_caps = array(
		'read_annotation',
		'edit_annotation',
		'delete_annotation',
	);

	/**
	 * Meta-caps that check post IDs.
	 *
	 * @var string[]
	 */
	public $post_check_meta_caps = array(
		'create_annotation',
		'read_annotations',
	);

	/**
	 * Other pseudo-caps.
	 *
	 * @var string[]
	 */
	public $other_pseudo_caps = array(
		'create_annotations',
		'delete_annotations',
		'delete_others_annotations',
		'delete_private_annotations',
		'delete_published_annotations',
		'edit_annotations',
		'edit_others_annotations',
		'edit_private_annotations',
		'edit_published_annotations',
		'publish_annotations',
		'read_annotations',
		'read_private_annotations',
	);

	/**
	 * Constructor.
	 *
	 * @param WP_UnitTestCase $case Test case.
	 */
	public function __construct( $case ) {
		$this->case = $case;
	}

	/**
	 * Get a user's role.
	 *
	 * @param  WP_User $user User.
	 *
	 * @return string        Role name.
	 */
	public function get_user_role( $user ) {
		return isset( $user->roles[0] ) ? $user->roles[0] : 'anonymous';
	}

	/**
	 * Sets and returns current user.
	 *
	 * @param WP_User|string $user User object or role name.
	 *
	 * @return WP_User             Existing user, or a new user.
	 */
	public function set_current_user( $user ) {
		if ( ! ( $user instanceof WP_User ) ) {
			$role = (string) $user;
			$user = $this->case->objects->create_user( $role );
		}
		wp_set_current_user( $user->ID );

		return $user;
	}

	/**
	 * Extracts IDs from a collection.
	 *
	 * @param  array $collection Collection.
	 *
	 * @return int[]             An array of IDs.
	 */
	public function extract_ids( $collection ) {
		$ids = array();

		foreach ( $collection as $value ) {
			if ( is_array( $value ) ) {
				$ids = array_merge( $ids, $this->extract_ids( $value ) );
			} elseif ( $value instanceof WP_User || $value instanceof WP_Post ) {
				$ids[] = (int) $value->ID;
			} elseif ( $value instanceof WP_Annotation ) {
				$ids[] = (int) $value->comment_ID;
			}
		}

		return $ids;
	}

	/**
	 * Removes null values from array or object.
	 *
	 * @param  array|object $collection An array or object.
	 *
	 * @return array|object             New array or object.
	 */
	public function remove_nulls( $collection ) {
		foreach ( $collection as $key => $value ) {
			if ( null === $value ) {
				unset( $collection[ $key ], $collection->{ $key } );
			}
		}

		return $collection;
	}

	/**
	 * Gets value from an array or object by path.
	 *
	 * @param array|object $value   An array or object to search.
	 * @param string       $path    A dot.path.leading.to.desired.key[0].
	 * @param mixed        $default Default value if not found.
	 *
	 * @return mixed|null           The desired value, else `$default` value.
	 */
	public function get_path( $value, $path, $default = null ) {
		if ( ! $value || ! $path ) {
			return $default;
		}

		foreach ( preg_split( '/\.|\[([0-9]+)\]/', $path, -1, PREG_SPLIT_DELIM_CAPTURE ) as $key ) {
			if ( is_array( $value ) && array_key_exists( $key, $value ) ) {
				$value = $value[ $key ];
			} elseif ( is_object( $value ) && property_exists( $value, $key ) ) {
				$value = $value->{ $key };
			} else {
				return $default;
			}
		}

		return $value;
	}
}
