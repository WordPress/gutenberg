<?php
/**
 * Tests for the `wp_guideline` capability policy: ambient cap synthesis and
 * per-post meta-cap resolution across the default roles.
 *
 * Each test asserts `WP_User::has_cap()` directly against a known role,
 * status, and ownership combination so a regression in the cap filter
 * surfaces at the shortest possible path through the stack.
 *
 * @package gutenberg
 */
class Gutenberg_Guidelines_Access_Test extends WP_UnitTestCase {

	/**
	 * Map of role => user ID. Populated once per test class.
	 *
	 * @var array<string,int>
	 */
	protected static $users = array();

	/**
	 * Set up class fixtures: one user per default role.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		foreach ( array( 'administrator', 'editor', 'author', 'contributor', 'subscriber' ) as $role ) {
			self::$users[ $role ] = $factory->user->create( array( 'role' => $role ) );
		}
	}

	/**
	 * Clean up class fixtures.
	 */
	public static function wpTearDownAfterClass() {
		foreach ( self::$users as $user_id ) {
			self::delete_user( $user_id );
		}
		self::$users = array();
	}

	/**
	 * Clean up guideline posts after each test so per-post matrix tests
	 * don't leak state into each other.
	 */
	public function tear_down() {
		$posts = get_posts(
			array(
				'post_type'      => Gutenberg_Guidelines_Post_Type::POST_TYPE,
				'post_status'    => array( 'private', 'publish' ),
				'posts_per_page' => -1,
			)
		);
		foreach ( $posts as $post ) {
			wp_delete_post( $post->ID, true );
		}

		parent::tear_down();
	}

	/**
	 * Returns a fresh WP_User for the named role so tests don't share
	 * mutable user state.
	 */
	private function user( $role ) {
		return new WP_User( self::$users[ $role ] );
	}

	/**
	 * Insert a guideline post owned by the named role.
	 */
	private function make_post( $owner_role, $status ) {
		return wp_insert_post(
			array(
				'post_type'    => Gutenberg_Guidelines_Post_Type::POST_TYPE,
				'post_status'  => $status,
				'post_title'   => "access test {$owner_role} {$status}",
				'post_content' => 'body',
				'post_author'  => self::$users[ $owner_role ],
			)
		);
	}

	/**
	 * Administrator holds every guideline-prefixed capability without a
	 * post context.
	 */
	public function test_administrator_ambient_caps() {
		$admin = $this->user( 'administrator' );

		foreach ( array(
			'read_guidelines',
			'edit_guidelines',
			'edit_others_guidelines',
			'edit_published_guidelines',
			'edit_private_guidelines',
			'publish_guidelines',
			'delete_guidelines',
			'delete_others_guidelines',
			'delete_published_guidelines',
			'delete_private_guidelines',
			'read_private_guidelines',
		) as $cap ) {
			$this->assertTrue( $admin->has_cap( $cap ), "Administrator should hold {$cap} ambiently" );
		}
	}

	/**
	 * Editor, Author, and Contributor hold the post-type read floor
	 * (`read_guidelines`) and the namespace-wide ownership cap
	 * (`edit_guidelines`) ambiently. Publish, private, and others-scoped
	 * primitives are not granted without a post context.
	 */
	public function test_contributor_plus_ambient_caps() {
		foreach ( array( 'editor', 'author', 'contributor' ) as $role ) {
			$user = $this->user( $role );

			foreach ( array( 'read_guidelines', 'edit_guidelines' ) as $cap ) {
				$this->assertTrue( $user->has_cap( $cap ), "{$role} should hold {$cap} ambiently" );
			}

			foreach ( array(
				'publish_guidelines',
				'read_private_guidelines',
				'edit_others_guidelines',
				'delete_others_guidelines',
				'edit_private_guidelines',
				'edit_published_guidelines',
				'delete_private_guidelines',
				'delete_published_guidelines',
			) as $cap ) {
				$this->assertFalse( $user->has_cap( $cap ), "{$role} must not hold {$cap} ambiently" );
			}
		}
	}

	/**
	 * Subscriber holds none of the guideline-prefixed capabilities.
	 */
	public function test_subscriber_ambient_caps() {
		$subscriber = $this->user( 'subscriber' );

		foreach ( array(
			'read_guidelines',
			'edit_guidelines',
			'edit_others_guidelines',
			'edit_published_guidelines',
			'edit_private_guidelines',
			'publish_guidelines',
			'delete_guidelines',
			'delete_others_guidelines',
			'delete_published_guidelines',
			'delete_private_guidelines',
			'read_private_guidelines',
		) as $cap ) {
			$this->assertFalse( $subscriber->has_cap( $cap ), "Subscriber must not hold {$cap}" );
		}
	}

	/**
	 * Subscriber per-post `read_post`, `edit_post`, and `delete_post`
	 * checks fail regardless of the row's owner or status.
	 */
	public function test_subscriber_per_post_caps() {
		$subscriber = $this->user( 'subscriber' );
		$post_id    = $this->make_post( 'administrator', 'publish' );

		$this->assertFalse( $subscriber->has_cap( 'read_post', $post_id ) );
		$this->assertFalse( $subscriber->has_cap( 'edit_post', $post_id ) );
		$this->assertFalse( $subscriber->has_cap( 'delete_post', $post_id ) );
	}

	/**
	 * Per-post access policy for Editor, Author, and Contributor:
	 *
	 * - own private rows: full read, edit, and delete
	 * - own publish rows: read only — edit and delete require Administrator
	 * - others' private rows: invisible (no read, edit, or delete)
	 * - others' publish rows: read only
	 *
	 * @dataProvider data_per_post_caps
	 */
	public function test_contributor_plus_per_post_caps( $role, $cap, $ownership, $status, $expected ) {
		$owner_role = 'self' === $ownership ? $role : 'administrator';
		$post_id    = $this->make_post( $owner_role, $status );

		$result = $this->user( $role )->has_cap( $cap, $post_id );

		if ( $expected ) {
			$this->assertTrue( $result, "{$role}.{$cap}({$ownership} {$status}) should be allowed" );
		} else {
			$this->assertFalse( $result, "{$role}.{$cap}({$ownership} {$status}) should be denied" );
		}
	}

	/**
	 * @return array Rows keyed `{role}.{cap}({ownership} {status})` so test
	 *               failures point at the exact combination.
	 */
	public function data_per_post_caps() {
		$matrix = array(
			// Own private: full CRUD.
			array( 'edit_post', 'self', 'private', true ),
			array( 'delete_post', 'self', 'private', true ),
			array( 'read_post', 'self', 'private', true ),

			// Own publish: read only.
			array( 'edit_post', 'self', 'publish', false ),
			array( 'delete_post', 'self', 'publish', false ),
			array( 'read_post', 'self', 'publish', true ),

			// Others' private: invisible.
			array( 'edit_post', 'other', 'private', false ),
			array( 'delete_post', 'other', 'private', false ),
			array( 'read_post', 'other', 'private', false ),

			// Others' publish: read only.
			array( 'edit_post', 'other', 'publish', false ),
			array( 'delete_post', 'other', 'publish', false ),
			array( 'read_post', 'other', 'publish', true ),
		);

		$cases = array();
		foreach ( array( 'editor', 'author', 'contributor' ) as $role ) {
			foreach ( $matrix as $row ) {
				list( $cap, $ownership, $status, $expected )       = $row;
				$cases[ "{$role}.{$cap}({$ownership} {$status})" ] = array( $role, $cap, $ownership, $status, $expected );
			}
		}
		return $cases;
	}

	/**
	 * Administrator passes every per-post check regardless of the row's
	 * owner or status.
	 */
	public function test_administrator_per_post_caps() {
		$admin = $this->user( 'administrator' );

		foreach ( array( 'private', 'publish' ) as $status ) {
			foreach ( array( 'administrator', 'contributor' ) as $owner_role ) {
				$post_id = $this->make_post( $owner_role, $status );

				foreach ( array( 'edit_post', 'delete_post', 'read_post' ) as $cap ) {
					$this->assertTrue(
						$admin->has_cap( $cap, $post_id ),
						"Administrator should have {$cap} on {$owner_role}'s {$status} row"
					);
				}
			}
		}
	}
}
