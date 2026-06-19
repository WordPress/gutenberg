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
 *
 * @group guidelines
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
	 * Returns a fresh WP_User for the named role so tests don't share
	 * mutable user state.
	 */
	private function user( $role ) {
		return new WP_User( self::$users[ $role ] );
	}

	/**
	 * Creates a guideline fixture owned by the named role and saved with the
	 * given post status.
	 *
	 * @param string $owner_role Role key from the self::$users fixture map.
	 * @param string $status     Post status for the guideline fixture.
	 * @return int Inserted guideline post ID.
	 */
	private function create_guideline( string $owner_role, string $status ): int {
		return self::factory()->post->create(
			array(
				'post_type'    => Gutenberg_Guidelines_Post_Type::POST_TYPE,
				'post_status'  => $status,
				'post_title'   => "{$status} guideline owned by {$owner_role}",
				'post_content' => "Guideline fixture content for {$owner_role} with {$status} status.",
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
	 * Per-post access policy across every role:
	 *
	 * - Administrator: full read, edit, and delete on every row.
	 * - Editor / Author / Contributor:
	 *   - own private rows: full read, edit, and delete
	 *   - own publish rows: read only — edit and delete require Administrator
	 *   - others' private rows: invisible
	 *   - others' publish rows: read only
	 * - Subscriber: blocked on every per-post check.
	 *
	 * @dataProvider data_per_post_caps_by_role
	 */
	public function test_per_post_caps_per_role( $role, $cap, $ownership, $status, $expected ) {
		$owner_role = 'self' === $ownership
			? $role
			: ( 'administrator' === $role ? 'contributor' : 'administrator' );
		$post_id    = $this->create_guideline( $owner_role, $status );

		$result = $this->user( $role )->has_cap( $cap, $post_id );

		$this->assertSame(
			$expected,
			$result,
			"{$role}.{$cap}({$ownership} {$status}) should be " . ( $expected ? 'allowed' : 'denied' )
		);
	}

	/**
	 * @return array Rows keyed `{role}.{cap}({ownership} {status})` so test
	 *               failures point at the exact combination.
	 */
	public function data_per_post_caps_by_role() {
		$contributor_plus_rules = array(
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

		$expand = static function ( bool $expected ): array {
			$rows = array();
			foreach ( array( 'self', 'other' ) as $ownership ) {
				foreach ( array( 'private', 'publish' ) as $status ) {
					foreach ( array( 'read_post', 'edit_post', 'delete_post' ) as $cap ) {
						$rows[] = array( $cap, $ownership, $status, $expected );
					}
				}
			}
			return $rows;
		};

		$rules_by_role = array(
			'administrator' => $expand( true ),
			'editor'        => $contributor_plus_rules,
			'author'        => $contributor_plus_rules,
			'contributor'   => $contributor_plus_rules,
			'subscriber'    => $expand( false ),
		);

		$cases = array();
		foreach ( $rules_by_role as $role => $rules ) {
			foreach ( $rules as $row ) {
				list( $cap, $ownership, $status, $expected )       = $row;
				$cases[ "{$role}.{$cap}({$ownership} {$status})" ] = array( $role, $cap, $ownership, $status, $expected );
			}
		}
		return $cases;
	}

	/**
	 * Taxonomy capability policy:
	 *
	 * - `manage_terms` / `delete_terms` — Administrator only.
	 * - `edit_terms` / `assign_terms` — Contributor and above, so agent flows
	 *   can introduce new type slugs (e.g. `memory`) and attach them to
	 *   guideline posts.
	 * - Subscribers hold none of these.
	 *
	 * @dataProvider data_taxonomy_caps_by_role
	 */
	public function test_taxonomy_caps_per_role( $role, $cap_key, $expected ) {
		$taxonomy  = get_taxonomy( Gutenberg_Guidelines_Post_Type::TAXONOMY );
		$primitive = $taxonomy->cap->{$cap_key};

		$this->assertSame(
			$expected,
			$this->user( $role )->has_cap( $primitive ),
			"{$role}.{$cap_key} (resolves to {$primitive}) should be " . ( $expected ? 'allowed' : 'denied' )
		);
	}

	/**
	 * @return array Rows keyed `{role}.{cap_key}` so test failures point at
	 *               the exact combination. Each row is [role, cap_key, expected].
	 */
	public function data_taxonomy_caps_by_role() {
		$matrix = array(
			'manage_terms' => array(
				'administrator' => true,
				'editor'        => false,
				'author'        => false,
				'contributor'   => false,
				'subscriber'    => false,
			),
			'edit_terms'   => array(
				'administrator' => true,
				'editor'        => true,
				'author'        => true,
				'contributor'   => true,
				'subscriber'    => false,
			),
			'delete_terms' => array(
				'administrator' => true,
				'editor'        => false,
				'author'        => false,
				'contributor'   => false,
				'subscriber'    => false,
			),
			'assign_terms' => array(
				'administrator' => true,
				'editor'        => true,
				'author'        => true,
				'contributor'   => true,
				'subscriber'    => false,
			),
		);

		$cases = array();
		foreach ( $matrix as $cap_key => $role_map ) {
			foreach ( $role_map as $role => $expected ) {
				$cases[ "{$role}.{$cap_key}" ] = array( $role, $cap_key, $expected );
			}
		}
		return $cases;
	}
}
