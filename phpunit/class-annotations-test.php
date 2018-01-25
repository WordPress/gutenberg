<?php
/**
 * Annotation (wp_annotation) post type tests
 *
 * @package gutenberg
 */

/**
 * Tests for the Annotation (wp_annotation) post type.
 */
class Annotations_Test extends WP_UnitTestCase {
	/**
	 * Fake user IDs.
	 *
	 * @var int[]
	 */
	protected static $user_id = array();

	/**
	 * Fake post IDs.
	 *
	 * @var int[]
	 */
	protected static $post_id = array();

	/**
	 * Fake annotation IDs.
	 *
	 * @var int[]
	 */
	protected static $anno_id = array();

	/**
	 * Roles used in test data.
	 *
	 * @var int[]
	 */
	protected static $roles = array(
		'administrator',
		'editor',
		'author',
		'contributor',
		'subscriber',
	);

	/**
	 * Create fake data before tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that creates fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		/*
		 * A user for each role.
		 * 	 - self::$user_id['{role}']
		 *
		 * A post with 'publish' and 'draft' status for each user.
		 *   - self::$post_id['post_by_{role}']
		 *   - self::$post_id['draft_by_{role}']
		 *
		 * A front-end annotation by each user, in each post (excluding drafts).
		 *   - self::$anno_id['{role}:in_post_by_{role}']
		 *
		 * ... plus front-end annotation replies.
		 *   - self::$anno_id['{role}:_reply_in_post_by_{role}']
		 *   - self::$anno_id['{role}:__reply_in_post_by_{role}']
		 *
		 * A back-end annotation by each user, in each post.
		 *   - self::$anno_id['{role}:in_post_backend_by_{role}']
		 *   - self::$anno_id['{role}:in_draft_backend_by_{role}']
		 *
		 * ... plus back-end annotation replies.
		 *   - self::$anno_id['{role}:_reply_in_post_backend_by_{role}']
		 *   - self::$anno_id['{role}:__reply_in_post_backend_by_{role}']
		 *   - self::$anno_id['{role}:_reply_in_draft_backend_by_{role}']
		 *   - self::$anno_id['{role}:__reply_in_draft_backend_by_{role}']
		 */

		foreach ( self::$roles as $r ) {
			self::$user_id[ $r ] = $factory->user->create( array( 'role' => $r ) );

			self::$post_id[ "post_by_{$r}" ] = $factory->post->create( array(
				'post_author'    => self::$user_id[ $r ],
				'post_type'      => 'post',
				'post_status'    => 'publish',
				'comment_status' => 'open',
				'post_title'     => 'Post by ' . $r,
				'post_content'   => '<p><strong>bold</strong> <em>italic</em> test post.</p>',
			) );

			self::$post_id[ "draft_by_{$r}" ] = $factory->post->create( array(
				'post_author'    => self::$user_id[ $r ],
				'post_type'      => 'post',
				'post_status'    => 'draft',
				'comment_status' => 'open',
				'post_title'     => 'Draft by ' . $r,
				'post_content'   => '<p><strong>bold</strong> <em>italic</em> test draft.</p>',
			) );
		}

		foreach ( self::$roles as $r ) {
			foreach ( self::$roles as $_r ) {
				foreach ( array(
					''      => array(
						'in_post_by' => self::$post_id[ "post_by_{$r}" ],
					),
					'admin' => array(
						'in_post_backend_by'  => self::$post_id[ "post_by_{$r}" ],
						'in_draft_backend_by' => self::$post_id[ "draft_by_{$r}" ],
					),
				) as $_parent_post_target => $_parent_post_key_ids ) {
					foreach ( $_parent_post_key_ids as $k => $_parent_post_id ) {
						$_common_annotation_meta = array(
							'_parent_post'         => $_parent_post_id,
							'_parent_post_target'  => $_parent_post_target,
							'_via'                 => 'gutenberg',

							'_creator'             => 'x-plugin',
							'_creator_meta'        => array(
								'display_name' => 'X Plugin',
								'image_url'    => 'https://example.com/image.png',
							),
							'_selector'            => array(
								'type'  => 'CssSelector',
								'value' => '#foo',
							),
							'_substatus'           => '',
							'_last_substatus_time' => 0,
							'_substatus_history'   => array(),
						);

						self::$anno_id[ "{$_r}:{$k}_{$r}" ] = $factory->post->create( array(
							'post_author'  => self::$user_id[ $_r ],
							'post_parent'  => 0,
							'post_status'  => 'publish',
							'post_type'    => WP_Annotation_Utils::$post_type,
							'post_content' => '<p><strong>bold</strong> <em>italic</em> test annotation.</p>',
							'meta_input'   => $_common_annotation_meta,
						) );

						self::$anno_id[ "{$_r}:_reply_{$k}_{$r}" ] = $factory->post->create( array(
							'post_author'  => self::$user_id[ $_r ],
							'post_status'  => 'publish',
							'post_parent'  => self::$anno_id[ "{$_r}:{$k}_{$r}" ],
							'post_type'    => WP_Annotation_Utils::$post_type,
							'post_content' => '<p><strong>bold</strong> <em>italic</em> test annotation reply.</p>',
							'meta_input'   => $_common_annotation_meta,
						) );

						self::$anno_id[ "{$_r}:__reply_{$k}_{$r}" ] = $factory->post->create( array(
							'post_author'  => self::$user_id[ $_r ],
							'post_status'  => 'publish',
							'post_parent'  => self::$anno_id[ "{$_r}:_reply_{$k}_{$r}" ],
							'post_type'    => WP_Annotation_Utils::$post_type,
							'post_content' => '<p><strong>bold</strong> <em>italic</em> test annotation reply to reply.</p>',
							'meta_input'   => $_common_annotation_meta,
						) );
					}
				}
			}
		}
	}

	/**
	 * Delete fake data after tests run.
	 */
	public static function wpTearDownAfterClass() {
		foreach ( self::$roles as $r ) {
			wp_delete_post( self::$post_id[ "post_by_{$r}" ] );
			wp_delete_post( self::$post_id[ "draft_by_{$r}" ] );

			foreach ( self::$roles as $_r ) {
				foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					wp_delete_post( self::$anno_id[ "{$_r}:{$k}_{$r}" ] );
					wp_delete_post( self::$anno_id[ "{$_r}:_reply_{$k}_{$r}" ] );
					wp_delete_post( self::$anno_id[ "{$_r}:__reply_{$k}_{$r}" ] );
				}
			}
			self::delete_user( self::$user_id[ $r ] );
		}
	}

	/**
	 * On setup.
	 */
	public function setUp() {
		parent::setUp();

		add_filter( 'annotation_allow_parent_post_targets', array( $this, 'allowParentPostTargets' ) );
	}

	/**
	 * On teardown.
	 */
	public function tearDown() {
		remove_filter( 'annotation_allow_parent_post_targets', array( $this, 'allowParentPostTargets' ) );

		parent::tearDown();
	}

	/**
	 * Allows all of the parent post targets being tested here.
	 *
	 * @return array Allowed parent post targets.
	 */
	public function allowParentPostTargets() {
		return array( '', 'admin' );
	}

	/*
	 * Basic tests.
	 */

	/**
	 * Check that we can get the post type.
	 */
	public function test_get_post_type() {
		$this->assertTrue( ! empty( WP_Annotation_Utils::$post_type ) );
		$this->assertTrue( is_string( WP_Annotation_Utils::$post_type ) );
	}

	/**
	 * Check that we can get parent post targets.
	 */
	public function test_get_parent_post_targets() {
		$this->assertContains( '', WP_Annotation_Utils::$parent_post_targets );
		$this->assertContains( 'admin', WP_Annotation_Utils::$parent_post_targets );
	}

	/**
	 * Check that we can get selectors.
	 */
	public function test_get_selectors() {
		$this->assertContains( 'FragmentSelector', WP_Annotation_Utils::$selectors );
		$this->assertContains( 'CssSelector', WP_Annotation_Utils::$selectors );
		$this->assertContains( 'XPathSelector', WP_Annotation_Utils::$selectors );
		$this->assertContains( 'TextQuoteSelector', WP_Annotation_Utils::$selectors );
		$this->assertContains( 'TextPositionSelector', WP_Annotation_Utils::$selectors );
		$this->assertContains( 'DataPositionSelector', WP_Annotation_Utils::$selectors );
		$this->assertContains( 'SvgSelector', WP_Annotation_Utils::$selectors );
		$this->assertContains( 'RangeSelector', WP_Annotation_Utils::$selectors );
	}

	/**
	 * Check that we can get substatuses.
	 */
	public function test_get_substatuses() {
		$this->assertContains( '', WP_Annotation_Utils::$substatuses );
		$this->assertContains( 'resolve', WP_Annotation_Utils::$substatuses );
		$this->assertContains( 'reject', WP_Annotation_Utils::$substatuses );
		$this->assertContains( 'archive', WP_Annotation_Utils::$substatuses );
	}

	/**
	 * Check that we have necessary fundamental hooks.
	 */
	public function test_post_type_hooks() {
		$this->assertNotEmpty( has_filter( 'map_meta_cap', 'WP_Annotation_Utils::on_map_meta_cap' ) );
		$this->assertNotEmpty( has_action( 'delete_post', 'WP_Annotation_Utils::on_delete_post' ) );
	}

	/*
	 * Test user permissions.
	 */

	/**
	 * Check that anonymous users gain very little access to annotations.
	 *
	 * Exception: Front-end public annotations in a public (published) parent post can be
	 * read by the public, which means that an anonymous user gains read access.
	 *
	 * Exception: Front-end public annotations in a public parent post can be created by
	 * the public. Assuming annotations are enabled in the parent post, and annotating
	 * does not require registration.
	 */
	public function test_anonymous_allow_deny_permissions() {
		$post_type = get_post_type_object( WP_Annotation_Utils::$post_type );
		$cap       = $post_type->cap; // Shorter.

		$r = 'anonymous';
		wp_set_current_user( 0 );

		$this->assertSame( "{$r}:create_posts:false", "{$r}:create_posts:" . ( current_user_can( $cap->create_posts ) ? 'true' : 'false' ) );
		$this->assertSame( "{$r}:edit_posts:false", "{$r}:edit_posts:" . ( current_user_can( $cap->edit_posts ) ? 'true' : 'false' ) );
		$this->assertSame( "{$r}:publish_posts:false", "{$r}:publish_posts:" . ( current_user_can( $cap->publish_posts ) ? 'true' : 'false' ) );
		$this->assertSame( "{$r}:delete_posts:false", "{$r}:delete_posts:" . ( current_user_can( $cap->delete_posts ) ? 'true' : 'false' ) );
		$this->assertSame( "{$r}:read_private_posts:false", "{$r}:read_private_posts:" . ( current_user_can( $cap->read_private_posts ) ? 'true' : 'false' ) );

		$this->assertSame( "{$r}:edit_others_posts:false", "{$r}:edit_others_posts:" . ( current_user_can( $cap->edit_others_posts ) ? 'true' : 'false' ) );
		$this->assertSame( "{$r}:edit_private_posts:false", "{$r}:edit_private_posts:" . ( current_user_can( $cap->edit_private_posts ) ? 'true' : 'false' ) );
		$this->assertSame( "{$r}:edit_published_posts:false", "{$r}:edit_published_posts:" . ( current_user_can( $cap->edit_published_posts ) ? 'true' : 'false' ) );

		$this->assertSame( "{$r}:delete_others_posts:false", "{$r}:delete_others_posts:" . ( current_user_can( $cap->delete_others_posts ) ? 'true' : 'false' ) );
		$this->assertSame( "{$r}:delete_published_posts:false", "{$r}:delete_published_posts:" . ( current_user_can( $cap->delete_published_posts ) ? 'true' : 'false' ) );
		$this->assertSame( "{$r}:delete_private_posts:false", "{$r}:delete_private_posts:" . ( current_user_can( $cap->delete_private_posts ) ? 'true' : 'false' ) );

		foreach ( self::$roles as $_r ) {
			foreach ( array( 'post_by', 'draft_by' ) as $k ) {
				foreach ( array( '', 'admin' ) as $t ) {
					$v = 'post_by' === $k && '' === $t ? 'true' : 'false';
					$this->assertSame( "{$r}:create_post:in_{$k}_{$_r}:{$t}:{$v}", "$r:create_post:in_{$k}_{$_r}:{$t}:" . ( current_user_can( $cap->create_post, self::$post_id[ "{$k}_{$_r}" ], $t ) ? 'true' : 'false' ) );
				}
			}
			foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
				$v = 'in_post_by' === $k ? 'true' : 'false';
				$this->assertSame( "{$r}:read_post:{$k}_{$_r}:{$v}", "$r:read_post:{$k}_{$_r}:" . ( current_user_can( $cap->read_post, self::$anno_id[ "{$_r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );

				$this->assertSame( "{$r}:edit_post:{$k}_{$_r}:false", "$r:edit_post:{$k}_{$_r}:" . ( current_user_can( $cap->edit_post, self::$anno_id[ "{$_r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
				$this->assertSame( "{$r}:delete_post:{$k}_{$_r}:false", "$r:delete_post:{$k}_{$_r}:" . ( current_user_can( $cap->delete_post, self::$anno_id[ "{$_r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
			}
		}
	}

	/**
	 * Check that subscribers have no access to back-end annotations whatsoever.
	 */
	public function test_subscriber_deny_permissions() {
		$post_type = get_post_type_object( WP_Annotation_Utils::$post_type );
		$cap       = $post_type->cap; // Shorter.

		foreach ( array( 'subscriber' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			$this->assertSame( "{$r}:create_posts:false", "{$r}:create_posts:" . ( current_user_can( $cap->create_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:edit_posts:false", "{$r}:edit_posts:" . ( current_user_can( $cap->edit_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:publish_posts:false", "{$r}:publish_posts:" . ( current_user_can( $cap->publish_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:delete_posts:false", "{$r}:delete_posts:" . ( current_user_can( $cap->delete_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:read_private_posts:false", "{$r}:read_private_posts:" . ( current_user_can( $cap->read_private_posts ) ? 'true' : 'false' ) );

			$this->assertSame( "{$r}:edit_others_posts:false", "{$r}:edit_others_posts:" . ( current_user_can( $cap->edit_others_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:edit_private_posts:false", "{$r}:edit_private_posts:" . ( current_user_can( $cap->edit_private_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:edit_published_posts:false", "{$r}:edit_published_posts:" . ( current_user_can( $cap->edit_published_posts ) ? 'true' : 'false' ) );

			$this->assertSame( "{$r}:delete_others_posts:false", "{$r}:delete_others_posts:" . ( current_user_can( $cap->delete_others_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:delete_published_posts:false", "{$r}:delete_published_posts:" . ( current_user_can( $cap->delete_published_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:delete_private_posts:false", "{$r}:delete_private_posts:" . ( current_user_can( $cap->delete_private_posts ) ? 'true' : 'false' ) );

			foreach ( self::$roles as $_r ) {
				foreach ( array( 'post_by', 'draft_by' ) as $k ) {
					foreach ( array( 'admin' ) as $t ) {
						$this->assertSame( "{$r}:create_post:in_{$k}_{$_r}:{$t}:false", "$r:create_post:in_{$k}_{$_r}:{$t}:" . ( current_user_can( $cap->create_post, self::$post_id[ "{$k}_{$_r}" ], $t ) ? 'true' : 'false' ) );
					}
				}
				foreach ( array( 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					$this->assertSame( "{$r}:read_post:{$k}_{$_r}:false", "$r:read_post:{$k}_{$_r}:" . ( current_user_can( $cap->read_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:edit_post:{$k}_{$_r}:false", "$r:edit_post:{$k}_{$_r}:" . ( current_user_can( $cap->edit_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:delete_post:{$k}_{$_r}:false", "$r:delete_post:{$k}_{$_r}:" . ( current_user_can( $cap->delete_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
				}
			}
		}
	}

	/**
	 * Check that subscribers have access to create and read front-end annotations, but
	 * that they do not have the ability to edit or delete front-end annotations.
	 */
	public function test_subscriber_allow_deny_permissions() {
		$post_type = get_post_type_object( WP_Annotation_Utils::$post_type );
		$cap       = $post_type->cap; // Shorter.

		foreach ( array( 'subscriber' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				foreach ( array( 'post_by' ) as $k ) {
					foreach ( array( '' ) as $t ) {
						$this->assertSame( "{$r}:create_post:in_{$k}_{$_r}:{$t}:true", "$r:create_post:in_{$k}_{$_r}:{$t}:" . ( current_user_can( $cap->create_post, self::$post_id[ "{$k}_{$_r}" ], $t ) ? 'true' : 'false' ) );
					}
				}
				foreach ( array( 'in_post_by' ) as $k ) {
					$this->assertSame( "{$r}:read_post:{$k}_{$_r}:true", "$r:read_post:{$k}_{$_r}:" . ( current_user_can( $cap->read_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:edit_post:{$k}_{$_r}:false", "$r:edit_post:{$k}_{$_r}:" . ( current_user_can( $cap->edit_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:delete_post:{$k}_{$_r}:false", "$r:delete_post:{$k}_{$_r}:" . ( current_user_can( $cap->delete_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
				}
			}
		}
	}

	/**
	 * Check that admins and editors can access all annotations without restriction.
	 * Admins and editors can create, read, edit, and delete any annotation.
	 */
	public function test_admin_editor_allow_permissions() {
		$post_type = get_post_type_object( WP_Annotation_Utils::$post_type );
		$cap       = $post_type->cap; // Shorter.

		foreach ( array( 'administrator', 'editor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			$this->assertSame( "{$r}:create_posts:true", "{$r}:create_posts:" . ( current_user_can( $cap->create_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:edit_posts:true", "{$r}:edit_posts:" . ( current_user_can( $cap->edit_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:publish_posts:true", "{$r}:publish_posts:" . ( current_user_can( $cap->publish_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:delete_posts:true", "{$r}:delete_posts:" . ( current_user_can( $cap->delete_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:read_private_posts:true", "{$r}:read_private_posts:" . ( current_user_can( $cap->read_private_posts ) ? 'true' : 'false' ) );

			$this->assertSame( "{$r}:edit_others_posts:true", "{$r}:edit_others_posts:" . ( current_user_can( $cap->edit_others_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:edit_private_posts:true", "{$r}:edit_private_posts:" . ( current_user_can( $cap->edit_private_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:edit_published_posts:true", "{$r}:edit_published_posts:" . ( current_user_can( $cap->edit_published_posts ) ? 'true' : 'false' ) );

			$this->assertSame( "{$r}:delete_others_posts:true", "{$r}:delete_others_posts:" . ( current_user_can( $cap->delete_others_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:delete_published_posts:true", "{$r}:delete_published_posts:" . ( current_user_can( $cap->delete_published_posts ) ? 'true' : 'false' ) );
			$this->assertSame( "{$r}:delete_private_posts:true", "{$r}:delete_private_posts:" . ( current_user_can( $cap->delete_private_posts ) ? 'true' : 'false' ) );

			foreach ( self::$roles as $_r ) {
				foreach ( array( 'post_by', 'draft_by' ) as $k ) {
					foreach ( array( '', 'admin' ) as $t ) {
						$this->assertSame( "{$r}:create_post:in_{$k}_{$_r}:{$t}:true", "$r:create_post:in_{$k}_{$_r}:{$t}:" . ( current_user_can( $cap->create_post, self::$post_id[ "{$k}_{$_r}" ], $t ) ? 'true' : 'false' ) );
					}
				}
				foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					$this->assertSame( "{$r}:read_post:{$k}_{$_r}:true", "$r:read_post:{$k}_{$_r}:" . ( current_user_can( $cap->read_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:edit_post:{$k}_{$_r}:true", "$r:edit_post:{$k}_{$_r}:" . ( current_user_can( $cap->edit_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:delete_post:{$k}_{$_r}:true", "$r:delete_post:{$k}_{$_r}:" . ( current_user_can( $cap->delete_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
				}
			}
		}
	}

	/**
	 * Check that authors and contributors are able to create, read, edit, and delete
	 * front and back-end annotations in their own published posts and drafts.
	 *
	 * Exception: A contributor is not allowed to edit or delete their own front-end
	 * annotations in any parent post that is now public; i.e., once their post is
	 * published, they are treated like any other front-end annotator. Even in a parent
	 * post that they're the author of.
	 */
	public function test_author_contributor_allow_permissions() {
		$post_type = get_post_type_object( WP_Annotation_Utils::$post_type );
		$cap       = $post_type->cap; // Shorter.

		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r !== $_r ) {
					continue; // Skip other roles.
				}
				foreach ( array( 'post_by', 'draft_by' ) as $k ) {
					foreach ( array( '', 'admin' ) as $t ) {
						$this->assertSame( "{$r}:create_post:in_{$k}_{$_r}:{$t}:true", "$r:create_post:in_{$k}_{$_r}:{$t}:" . ( current_user_can( $cap->create_post, self::$post_id[ "{$k}_{$_r}" ], $t ) ? 'true' : 'false' ) );
					}
				}
				foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					$this->assertSame( "{$r}:read_post:{$k}_{$_r}:true", "$r:read_post:{$k}_{$_r}:" . ( current_user_can( $cap->read_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );

					$v = 'in_post_by' === $k && 'contributor' === $r ? 'false' : 'true';
					$this->assertSame( "{$r}:edit_post:{$k}_{$_r}:{$v}", "$r:edit_post:{$k}_{$_r}:" . ( current_user_can( $cap->edit_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:delete_post:{$k}_{$_r}:{$v}", "$r:delete_post:{$k}_{$_r}:" . ( current_user_can( $cap->delete_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
				}
			}
		}
	}

	/**
	 * Check that authors and contributors are unable to access back-end annotations in
	 * any post that was drafted or published by someone else other than them.
	 */
	public function test_author_contributor_deny_permissions() {
		$post_type = get_post_type_object( WP_Annotation_Utils::$post_type );
		$cap       = $post_type->cap; // Shorter.

		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r === $_r ) {
					continue; // Skip their own here.
				}
				foreach ( array( 'post_by', 'draft_by' ) as $k ) {
					foreach ( array( 'admin' ) as $t ) {
						$this->assertSame( "{$r}:create_post:in_{$k}_{$_r}:{$t}:false", "$r:create_post:in_{$k}_{$_r}:{$t}:" . ( current_user_can( $cap->create_post, self::$post_id[ "{$k}_{$_r}" ], $t ) ? 'true' : 'false' ) );
					}
				}
				foreach ( array( 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					$this->assertSame( "{$r}:read_post:{$k}_{$_r}:false", "$r:read_post:{$k}_{$_r}:" . ( current_user_can( $cap->read_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:edit_post:{$k}_{$_r}:false", "$r:edit_post:{$k}_{$_r}:" . ( current_user_can( $cap->edit_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:delete_post:{$k}_{$_r}:false", "$r:delete_post:{$k}_{$_r}:" . ( current_user_can( $cap->delete_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
				}
			}
		}
	}

	/*
	 * Test post annotation deletion.
	 */

	/**
	 * Check that permanently deleting a post erases all of its annotations.
	 */
	public function test_delete_post_annotations() {
		$post_id = $this->factory->post->create( array(
			'post_author'  => self::$user_id['editor'],
			'post_type'    => 'post',
			'post_status'  => 'publish',
			'post_title'   => 'Post by editor.',
			'post_content' => '<p><strong>bold</strong> <em>italic</em> test post.</p>',
		) );
		$this->assertInternalType( 'int', $post_id );
		$this->assertGreaterThan( 0, $post_id );

		for ( $i = 0; $i < 3; $i++ ) {
			$annotation_id = $this->factory->post->create( array(
				'post_parent'  => 0,
				'post_status'  => 'publish',
				'post_author'  => self::$user_id['editor'],
				'post_type'    => WP_Annotation_Utils::$post_type,
				'post_content' => '<p><strong>bold</strong> <em>italic</em> test annotation.</p>',
				'meta_input'   => array(
					'_parent_post'        => $post_id,
					'_parent_post_target' => 'admin',
					'_via'                => 'gutenberg',
				),
			) );
			$this->assertInternalType( 'int', $annotation_id );
			$this->assertGreaterThan( 0, $annotation_id );
		}
		wp_delete_post( $post_id, true );

		$query          = new WP_Query();
		$annotation_ids = $query->query( array(
			'fields'              => 'ids',
			'post_type'           => WP_Annotation_Utils::$post_type,
			'post_status'         => array_keys( get_post_stati() ),
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
			'suppress_filters'    => true,
			'posts_per_page'      => -1,
			'meta_query'          => array(
				'key'   => '_parent_post',
				'value' => $post_id,
			),
		) );

		$this->assertEmpty( $annotation_ids );
	}
}
