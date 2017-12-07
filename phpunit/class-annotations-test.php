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
	 * Our fake user IDs.
	 *
	 * @var int[]
	 */
	protected static $user_id = array();

	/**
	 * Our fake post IDs.
	 *
	 * @var int[]
	 */
	protected static $post_id = array();

	/**
	 * Our fake annotation IDs.
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
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		/*
		 * - A user for each role.
		 * 	 - self::$user_id['{role}']
		 *
		 * - A post with 'publish' and 'draft' status for each user.
		 *   - self::$post_id['by_{role}']
		 *   - self::$post_id['draft_by_{role}']
		 *
		 * - An annotation by each user as a child of each post (by each user).
		 *   - self::$anno_id['{role}:in_post_by_{role}']
		 *   - ...etc. for every post status & role combo.
		 *
		 * - Annotation replies by each user as nested children.
		 *   - self::$anno_id['{role}:_reply_in_post_by_{role}']
		 *   - self::$anno_id['{role}:__reply_in_post_by_{role}']
		 *   - ...etc. for every post status & role combo.
		 */

		foreach ( self::$roles as $r ) {
			self::$user_id[ $r ] = $factory->user->create( array( 'role' => $r ) );

			self::$post_id[ "by_{$r}" ] = $factory->post->create( array(
				'post_author'  => self::$user_id[ $r ],
				'post_type'    => 'post',
				'post_status'  => 'publish',
				'post_title'   => 'Post by ' . $r,
				'post_content' => '<p><strong>bold</strong> <em>italic</em> test post.</p>',
			) );

			self::$post_id[ "draft_by_{$r}" ] = $factory->post->create( array(
				'post_author'  => self::$user_id[ $r ],
				'post_type'    => 'post',
				'post_status'  => 'draft',
				'post_title'   => 'Draft by ' . $r,
				'post_content' => '<p><strong>bold</strong> <em>italic</em> test draft.</p>',
			) );
		}

		foreach ( self::$roles as $r ) {
			foreach ( self::$roles as $_r ) {
				foreach ( array(
					'in_post_by'  => self::$post_id[ "by_{$r}" ],
					'in_draft_by' => self::$post_id[ "draft_by_{$r}" ],
				) as $k => $_parent_post_id ) {
					$common_annotation_meta = array(
						'_parent_post_id'      => $_parent_post_id,
						'_selection'           => array(
							'ranges' => array(
								array(
									'begin' => array(
										'offset' => 0,
									),
									'end'   => array(
										'offset' => 100,
									),
								),
							),
						),
						'_annotator'           => 'x-plugin',
						'_annotator_meta'      => array(
							'display_name' => 'X Plugin',
							'md5_email'    => 'c8e0057f78fa5b54326cd437494b87e9',
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
						'meta_input'   => $common_annotation_meta,
					) );

					self::$anno_id[ "{$_r}:_reply_{$k}_{$r}" ] = $factory->post->create( array(
						'post_author'  => self::$user_id[ $_r ],
						'post_status'  => 'publish',
						'post_parent'  => self::$anno_id[ "{$_r}:{$k}_{$r}" ],
						'post_type'    => WP_Annotation_Utils::$post_type,
						'post_content' => '<p><strong>bold</strong> <em>italic</em> test annotation reply.</p>',
						'meta_input'   => $common_annotation_meta,
					) );

					self::$anno_id[ "{$_r}:__reply_{$k}_{$r}" ] = $factory->post->create( array(
						'post_author'  => self::$user_id[ $_r ],
						'post_status'  => 'publish',
						'post_parent'  => self::$anno_id[ "{$_r}:_reply_{$k}_{$r}" ],
						'post_type'    => WP_Annotation_Utils::$post_type,
						'post_content' => '<p><strong>bold</strong> <em>italic</em> test annotation reply.</p>',
						'meta_input'   => $common_annotation_meta,
					) );
				}
			}
		}
	}

	/**
	 * Delete fake data after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		foreach ( self::$roles as $r ) {
			wp_delete_post( self::$post_id[ "by_{$r}" ] );
			wp_delete_post( self::$post_id[ "draft_by_{$r}" ] );

			foreach ( self::$roles as $_r ) {
				foreach ( array( 'in_post_by', 'in_draft_by' ) as $k ) {
					wp_delete_post( self::$anno_id[ "{$_r}:{$k}_{$r}" ] );
					wp_delete_post( self::$anno_id[ "{$_r}:_reply_{$k}_{$r}" ] );
					wp_delete_post( self::$anno_id[ "{$_r}:__reply_{$k}_{$r}" ] );
				}
			}
			self::delete_user( self::$user_id[ $r ] );
		}
	}

	/*
	 * Basic tests.
	 */

	/**
	 * Check that we can get the annotation post type.
	 */
	public function test_get_post_type() {
		$this->assertTrue( ! empty( WP_Annotation_Utils::$post_type ) );
		$this->assertTrue( is_string( WP_Annotation_Utils::$post_type ) );
		$this->assertSame( WP_Annotation_Utils::$post_type, gutenberg_annotation_post_type() );
	}

	/**
	 * Check that we can get annotation substatuses.
	 */
	public function test_get_substatuses() {
		$this->assertContains( '', WP_Annotation_Utils::$substatuses );
		$this->assertContains( 'archived', WP_Annotation_Utils::$substatuses );
	}

	/**
	 * Check that we have necessary hooks for the post type.
	 */
	public function test_post_type_hooks() {
		$this->assertNotEmpty( has_filter( 'user_has_cap', 'WP_Annotation_Utils::on_user_has_cap' ) );
		$this->assertNotEmpty( has_action( 'delete_post', 'WP_Annotation_Utils::on_delete_post' ) );
	}

	/*
	 * Test user permissions.
	 */

	/**
	 * Check that nonexistent users have no access to annotations whatsoever.
	 */
	public function test_nonexistent_deny_permissions() {
		$post_type = get_post_type_object( WP_Annotation_Utils::$post_type );
		$cap       = $post_type->cap; // Shorter.

		$r = 'nonexistent';
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
			foreach ( array( 'in_post_by', 'in_draft_by' ) as $k ) {
				$this->assertSame( "{$r}:read_post:{$k}_{$_r}:false", "$r:read_post:{$k}_{$_r}:" . ( current_user_can( $cap->read_post, self::$anno_id[ "{$_r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
				$this->assertSame( "{$r}:edit_post:{$k}_{$_r}:false", "$r:edit_post:{$k}_{$_r}:" . ( current_user_can( $cap->edit_post, self::$anno_id[ "{$_r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
				$this->assertSame( "{$r}:delete_post:{$k}_{$_r}:false", "$r:delete_post:{$k}_{$_r}:" . ( current_user_can( $cap->delete_post, self::$anno_id[ "{$_r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
			}
		}
	}

	/**
	 * Check that subscribers have no access to annotations whatsoever.
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
				foreach ( array( 'in_post_by', 'in_draft_by' ) as $k ) {
					$this->assertSame( "{$r}:read_post:{$k}_{$_r}:false", "$r:read_post:{$k}_{$_r}:" . ( current_user_can( $cap->read_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:edit_post:{$k}_{$_r}:false", "$r:edit_post:{$k}_{$_r}:" . ( current_user_can( $cap->edit_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:delete_post:{$k}_{$_r}:false", "$r:delete_post:{$k}_{$_r}:" . ( current_user_can( $cap->delete_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
				}
			}
		}
	}

	/**
	 * Check that admins and editors can access all annotations without restriction.
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
				foreach ( array( 'in_post_by', 'in_draft_by' ) as $k ) {
					$this->assertSame( "{$r}:read_post:{$k}_{$_r}:true", "$r:read_post:{$k}_{$_r}:" . ( current_user_can( $cap->read_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:edit_post:{$k}_{$_r}:true", "$r:edit_post:{$k}_{$_r}:" . ( current_user_can( $cap->edit_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:delete_post:{$k}_{$_r}:true", "$r:delete_post:{$k}_{$_r}:" . ( current_user_can( $cap->delete_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
				}
			}
		}
	}

	/**
	 * Check that authors are able to access annotations in their own posts.
	 * An author can edit_published_posts, so they can annotate published posts too.
	 */
	public function test_author_allow_permissions() {
		$post_type = get_post_type_object( WP_Annotation_Utils::$post_type );
		$cap       = $post_type->cap; // Shorter.

		foreach ( array( 'author' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r !== $_r ) {
					continue; // Skip over other roles.
				}
				foreach ( array( 'in_post_by', 'in_draft_by' ) as $k ) {
					$this->assertSame( "{$r}:read_post:{$k}_{$_r}:true", "$r:read_post:{$k}_{$_r}:" . ( current_user_can( $cap->read_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:edit_post:{$k}_{$_r}:true", "$r:edit_post:{$k}_{$_r}:" . ( current_user_can( $cap->edit_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:delete_post:{$k}_{$_r}:true", "$r:delete_post:{$k}_{$_r}:" . ( current_user_can( $cap->delete_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
				}
			}
		}
	}

	/**
	 * Check that authors and contributors are able to access their own annotations
	 * in a draft. Note: Contributors are unable to access once a post is published,
	 * because a contributor is unable to edit_published_posts.
	 */
	public function test_author_contributor_allow_permissions() {
		$post_type = get_post_type_object( WP_Annotation_Utils::$post_type );
		$cap       = $post_type->cap; // Shorter.

		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r !== $_r ) {
					continue; // Skip over others'.
				}
				foreach ( array( 'in_draft_by' ) as $k ) {
					$this->assertSame( "{$r}:read_post:{$k}_{$_r}:true", "$r:read_post:{$k}_{$_r}:" . ( current_user_can( $cap->read_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:edit_post:{$k}_{$_r}:true", "$r:edit_post:{$k}_{$_r}:" . ( current_user_can( $cap->edit_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:delete_post:{$k}_{$_r}:true", "$r:delete_post:{$k}_{$_r}:" . ( current_user_can( $cap->delete_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
				}
			}
		}
	}

	/**
	 * Check that authors and contributors are unable to access annotations
	 * in a post that was drafted or published by 'someone else' other than them.
	 */
	public function test_author_contributor_deny_permissions() {
		$post_type = get_post_type_object( WP_Annotation_Utils::$post_type );
		$cap       = $post_type->cap; // Shorter.

		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r === $_r ) {
					continue; // Skip over their own here.
				}
				foreach ( array( 'in_post_by', 'in_draft_by' ) as $k ) {
					$this->assertSame( "{$r}:read_post:{$k}_{$_r}:false", "$r:read_post:{$k}_{$_r}:" . ( current_user_can( $cap->read_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:edit_post:{$k}_{$_r}:false", "$r:edit_post:{$k}_{$_r}:" . ( current_user_can( $cap->edit_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
					$this->assertSame( "{$r}:delete_post:{$k}_{$_r}:false", "$r:delete_post:{$k}_{$_r}:" . ( current_user_can( $cap->delete_post, self::$anno_id[ "{$r}:{$k}_{$_r}" ] ) ? 'true' : 'false' ) );
				}
			}
		}
	}

	/**
	 * Check that contributors are unable to access annotations (including their own)
	 * in a post 'published' by anyone (including them). Contributors can't edit_published_posts.
	 */
	public function test_contributor_deny_permissions() {
		$post_type = get_post_type_object( WP_Annotation_Utils::$post_type );
		$cap       = $post_type->cap; // Shorter.

		foreach ( array( 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				foreach ( array( 'in_post_by' ) as $k ) {
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
				'post_author'  => self::$user_id['editor'],
				'post_parent'  => 0,
				'post_status'  => 'publish',
				'post_type'    => WP_Annotation_Utils::$post_type,
				'post_content' => '<p><strong>bold</strong> <em>italic</em> test annotation.</p>',
				'meta_input'   => array( '_parent_post_id' => $post_id ),
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
				'key'   => '_parent_post_id',
				'value' => $post_id,
			),
		) );

		$this->assertEmpty( $annotation_ids );
	}
}
