<?php
/**
 * Annotation Comment Type Tests
 *
 * @package gutenberg
 */

/**
 * Tests for annotation comment types.
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
		 * A front-end annotation by each user, in each post.
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
					'annotation'       => array(
						'in_post_by' => self::$post_id[ "post_by_{$r}" ],
					),
					'admin_annotation' => array(
						'in_post_backend_by'  => self::$post_id[ "post_by_{$r}" ],
						'in_draft_backend_by' => self::$post_id[ "draft_by_{$r}" ],
					),
				) as $_comment_type => $_post_key_ids ) {
					foreach ( $_post_key_ids as $k => $_post_id ) {
						$_common_annotation_data = array(
							'user_id'          => self::$user_id[ $_r ],
							'comment_post_ID'  => $_post_id,
							'comment_type'     => $_comment_type,
							'comment_approved' => '1',
						);
						$_common_annotation_meta = array(
							'_via'      => 'gutenberg',
							'_selector' => array(
								'type'  => 'CssSelector',
								'value' => '#foo',
							),
						);

						self::$anno_id[ "{$_r}:{$k}_{$r}" ] = $factory->comment->create(
							array_merge( $_common_annotation_data, array(
								'comment_parent'  => 0,
								'comment_content' => '<p><strong>bold</strong> <em>italic</em> test annotation.</p>',
								'comment_meta'    => $_common_annotation_meta,
							) )
						);

						self::$anno_id[ "{$_r}:_reply_{$k}_{$r}" ] = $factory->comment->create(
							array_merge( $_common_annotation_data, array(
								'comment_parent'  => self::$anno_id[ "{$_r}:{$k}_{$r}" ],
								'comment_content' => '<p><strong>bold</strong> <em>italic</em> test annotation reply.</p>',
								'comment_meta'    => $_common_annotation_meta,
							) )
						);

						self::$anno_id[ "{$_r}:__reply_{$k}_{$r}" ] = $factory->comment->create(
							array_merge( $_common_annotation_data, array(
								'comment_parent'  => self::$anno_id[ "{$_r}:_reply_{$k}_{$r}" ],
								'comment_content' => '<p><strong>bold</strong> <em>italic</em> test annotation reply to reply.</p>',
								'comment_meta'    => $_common_annotation_meta,
							) )
						);
					}
				}
			}
		}
	}

	/**
	 * Delete fake data after our tests run.
	 */
	public static function wpTearDownAfterClass() {
		foreach ( self::$roles as $r ) {
			wp_delete_post( self::$post_id[ "post_by_{$r}" ], true );
			wp_delete_post( self::$post_id[ "draft_by_{$r}" ], true );

			foreach ( self::$roles as $_r ) {
				foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					wp_delete_comment( self::$anno_id[ "{$_r}:{$k}_{$r}" ], true );
					wp_delete_comment( self::$anno_id[ "{$_r}:_reply_{$k}_{$r}" ], true );
					wp_delete_comment( self::$anno_id[ "{$_r}:__reply_{$k}_{$r}" ], true );
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

		add_filter( 'annotation_allow_types', array( $this, 'allowTypes' ) );
		remove_action( 'check_comment_flood', 'check_comment_flood_db', 10, 4 );
	}

	/**
	 * On teardown.
	 */
	public function tearDown() {
		remove_filter( 'annotation_allow_types', array( $this, 'allowTypes' ) );
		add_action( 'check_comment_flood', 'check_comment_flood_db', 10, 4 );

		parent::tearDown();
	}

	/**
	 * Allows all of the annotation comment types being tested here.
	 *
	 * @return array Allowed annotation comment types.
	 */
	public function allowTypes() {
		return array( 'annotation', 'admin_annotation' );
	}

	/*
	 * Basic tests.
	 */

	/**
	 * Check that we can get types.
	 */
	public function test_get_types() {
		$this->assertContains( 'annotation', WP_Annotation_Utils::$types );
		$this->assertContains( 'admin_annotation', WP_Annotation_Utils::$types );
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
	 * Check that we can get custom statuses.
	 */
	public function test_get_substatuses() {
		$this->assertContains( 'resolve', WP_Annotation_Utils::$custom_statuses );
		$this->assertContains( 'reject', WP_Annotation_Utils::$custom_statuses );
		$this->assertContains( 'archive', WP_Annotation_Utils::$custom_statuses );
	}

	/**
	 * Check that we have necessary hooks.
	 */
	public function test_has_hooks() {
		$this->assertNotEmpty( has_filter( 'map_meta_cap', 'WP_Annotation_Utils::on_map_meta_cap' ) );
		$this->assertNotEmpty( has_filter( 'comments_clauses', 'WP_Annotation_Utils::on_comments_clauses' ) );
	}

	/*
	 * Test user permissions.
	 */

	/**
	 * Check that anonymous users gain very little access to annotations.
	 *
	 * Exception: Front-end public annotations in a public (published) post can be read
	 * by the public, which means that an anonymous user gains read access.
	 *
	 * Exception: Front-end public annotations in a public post can be created by the
	 * public. Assuming comments are enabled in the post, and commenting does not require
	 * registration.
	 */
	public function test_anonymous_allow_deny_permissions() {
		$r = 'anonymous';
		wp_set_current_user( 0 );

		foreach ( array(
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
			'read_private_annotations',
		) as $c ) {
			foreach ( array( null, 'annotation', 'admin_annotation' ) as $t ) {
				$i = "{$r}:{$c}:{$t}"; // Identifier.
				$this->assertSame( "{$i}:false", "{$i}:" . ( current_user_can( $c, $t ) ? 'true' : 'false' ) );
			}
		}

		foreach ( self::$roles as $_r ) {
			foreach ( array( 'post_by', 'draft_by' ) as $k ) {
				foreach ( array( 'annotation', 'admin_annotation' ) as $t ) {
					foreach ( array( 'create_annotation' ) as $c ) {
						$p = self::$post_id[ "{$k}_{$_r}" ];
						$i = "{$r}:{$c}:in_{$k}_{$_r}:{$t}"; // Identifier.
						$v = 'post_by' === $k && 'annotation' === $t ? 'true' : 'false';
						$this->assertSame( "{$i}:{$v}", "{$i}:" . ( current_user_can( $c, $p, $t ) ? 'true' : 'false' ) );
					}
				}
			}
			foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
				foreach ( array( 'read_annotation', 'edit_annotation', 'delete_annotation' ) as $c ) {
					$a = self::$anno_id[ "{$_r}:{$k}_{$_r}" ];
					$i = "{$r}:{$c}:{$k}_{$_r}"; // Identifier.
					$v = 'in_post_by' === $k && 'read_annotation' === $c ? 'true' : 'false';
					$this->assertSame( "{$i}:{$v}", "{$i}:" . ( current_user_can( $c, $a ) ? 'true' : 'false' ) );
				}
			}
		}
	}

	/**
	 * Check that subscribers have no access to back-end annotations whatsoever.
	 */
	public function test_subscriber_deny_permissions() {
		foreach ( array( 'subscriber' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( array(
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
				'read_private_annotations',
			) as $c ) {
				foreach ( array( null, 'admin_annotation' ) as $t ) {
					$i = "{$r}:{$c}:{$t}"; // Identifier.
					$this->assertSame( "{$i}:false", "{$i}:" . ( current_user_can( $c, $t ) ? 'true' : 'false' ) );
				}
			}

			foreach ( self::$roles as $_r ) {
				foreach ( array( 'post_by', 'draft_by' ) as $k ) {
					foreach ( array( null, 'admin_annotation' ) as $t ) {
						foreach ( array( 'create_annotation' ) as $c ) {
							$p = self::$post_id[ "{$k}_{$_r}" ];
							$i = "{$r}:{$c}:in_{$k}_{$_r}:{$t}"; // Identifier.
							$this->assertSame( "{$i}:false", "{$i}:" . ( current_user_can( $c, $p, $t ) ? 'true' : 'false' ) );
						}
					}
				}
				foreach ( array( 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					foreach ( array( 'read_annotation', 'edit_annotation', 'delete_annotation' ) as $c ) {
						$a = self::$anno_id[ "{$r}:{$k}_{$_r}" ];
						$i = "{$r}:{$c}:{$k}_{$_r}"; // Identifier.
						$this->assertSame( "{$i}:false", "{$i}:" . ( current_user_can( $c, $a ) ? 'true' : 'false' ) );
					}
				}
			}
		}
	}

	/**
	 * Check that subscribers have access to create and read front-end annotations, but
	 * that they do not have the ability to edit or delete front-end annotations.
	 */
	public function test_subscriber_allow_deny_permissions() {
		foreach ( array( 'subscriber' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				foreach ( array( 'post_by' ) as $k ) {
					foreach ( array( 'annotation' ) as $t ) {
						foreach ( array( 'create_annotation' ) as $c ) {
							$p = self::$post_id[ "{$k}_{$_r}" ];
							$i = "{$r}:{$c}:{$k}_{$_r}:{$t}"; // Identifier.
							$this->assertSame( "{$i}:true", "{$i}:" . ( current_user_can( $c, $p, $t ) ? 'true' : 'false' ) );
						}
					}
				}
				foreach ( array( 'in_post_by' ) as $k ) {
					foreach ( array( 'read_annotation', 'edit_annotation', 'delete_annotation' ) as $c ) {
						$a = self::$anno_id[ "{$r}:{$k}_{$_r}" ];
						$i = "{$r}:{$c}:{$k}_{$_r}"; // Identifier.
						$v = 'in_post_by' === $k && 'read_annotation' === $c ? 'true' : 'false';
						$this->assertSame( "{$i}:{$v}", "{$i}:" . ( current_user_can( $c, $a ) ? 'true' : 'false' ) );
					}
				}
			}
		}
	}

	/**
	 * Check that admins and editors can access all annotations without restriction.
	 * Admins and editors can create, read, edit, delete, and otherwise manipulate any
	 * annotation.
	 */
	public function test_admin_editor_allow_permissions() {
		foreach ( array( 'administrator', 'editor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( array(
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
				'read_private_annotations',
			) as $c ) {
				foreach ( array( null, 'annotation', 'admin_annotation' ) as $t ) {
					$i = "{$r}:{$c}:{$t}"; // Identifier.
					$this->assertSame( "{$i}:true", "{$i}:" . ( current_user_can( $c, $t ) ? 'true' : 'false' ) );
				}
			}

			foreach ( self::$roles as $_r ) {
				foreach ( array( 'post_by', 'draft_by' ) as $k ) {
					foreach ( array( 'annotation', 'admin_annotation' ) as $t ) {
						foreach ( array( 'create_annotation' ) as $c ) {
							$p = self::$post_id[ "{$k}_{$_r}" ];
							$i = "{$r}:{$c}:in_{$k}_{$_r}:{$t}"; // Identifier.
							$this->assertSame( "{$i}:true", "{$i}:" . ( current_user_can( $c, $p, $t ) ? 'true' : 'false' ) );
						}
					}
				}
				foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					foreach ( array( 'read_annotation', 'edit_annotation', 'delete_annotation' ) as $c ) {
						$a = self::$anno_id[ "{$r}:{$k}_{$_r}" ];
						$i = "{$r}:{$c}:{$k}_{$_r}"; // Identifier.
						$this->assertSame( "{$i}:true", "{$i}:" . ( current_user_can( $c, $a ) ? 'true' : 'false' ) );
					}
				}
			}
		}
	}

	/**
	 * Check that authors and contributors are able to create, read, edit, and delete
	 * front and back-end annotations in their own published posts and also in their
	 * drafts.
	 *
	 * Exception: A contributor is not allowed to edit or delete their own front-end
	 * annotations in any post that is now public; i.e., once their post is published,
	 * they are treated like any other front-end annotator. Even in a post that they're
	 * the author of.
	 */
	public function test_author_contributor_allow_permissions() {
		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r !== $_r ) {
					continue; // Skip other roles.
				}
				foreach ( array( 'post_by', 'draft_by' ) as $k ) {
					foreach ( array( 'annotation', 'admin_annotation' ) as $t ) {
						foreach ( array( 'create_annotation' ) as $c ) {
							$p = self::$post_id[ "{$k}_{$_r}" ];
							$i = "{$r}:{$c}:in_{$k}_{$_r}:{$t}"; // Identifier.
							$this->assertSame( "{$i}:true", "{$i}:" . ( current_user_can( $c, $p, $t ) ? 'true' : 'false' ) );
						}
					}
				}
				foreach ( array( 'in_post_by', 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					foreach ( array( 'read_annotation', 'edit_annotation', 'delete_annotation' ) as $c ) {
						$a = self::$anno_id[ "{$r}:{$k}_{$_r}" ];
						$i = "{$r}:{$c}:{$k}_{$_r}"; // Identifier.
						$v = 'contributor' === $r && 'in_post_by' === $k && 'read_annotation' !== $c ? 'false' : 'true';
						$this->assertSame( "{$i}:{$v}", "{$i}:" . ( current_user_can( $c, $a ) ? 'true' : 'false' ) );
					}
				}
			}
		}
	}

	/**
	 * Check that authors and contributors are unable to access back-end annotations in
	 * any post that was drafted or published by someone else other than them.
	 */
	public function test_author_contributor_deny_permissions() {
		foreach ( array( 'author', 'contributor' ) as $r ) {
			wp_set_current_user( self::$user_id[ $r ] );

			foreach ( self::$roles as $_r ) {
				if ( $r === $_r ) {
					continue; // Skip their own here.
				}
				foreach ( array( 'post_by', 'draft_by' ) as $k ) {
					foreach ( array( 'admin_annotation' ) as $t ) {
						foreach ( array( 'create_annotation' ) as $c ) {
							$p = self::$post_id[ "{$k}_{$_r}" ];
							$i = "{$r}:{$c}:in_{$k}_{$_r}:{$t}"; // Identifier.
							$this->assertSame( "{$i}:false", "{$i}:" . ( current_user_can( $c, $p, $t ) ? 'true' : 'false' ) );
						}
					}
				}
				foreach ( array( 'in_post_backend_by', 'in_draft_backend_by' ) as $k ) {
					foreach ( array( 'read_annotation', 'edit_annotation', 'delete_annotation' ) as $c ) {
						$a = self::$anno_id[ "{$r}:{$k}_{$_r}" ];
						$i = "{$r}:{$c}:{$k}_{$_r}"; // Identifier.
						$this->assertSame( "{$i}:false", "{$i}:" . ( current_user_can( $c, $a ) ? 'true' : 'false' ) );
					}
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

		foreach ( array( 'annotation', 'admin_annotation' ) as $type ) {
			for ( $i = 0; $i < 2; $i++ ) { // Two of each type.
				$comment_id = $this->factory->comment->create( array(
					'comment_post_ID'  => $post_id,
					'comment_type'     => $type,
					'comment_parent'   => 0,
					'comment_approved' => '1',
					'user_id'          => self::$user_id['editor'],
					'comment_content'  => '<p><strong>bold</strong> <em>italic</em> test annotation.</p>',
					'comment_meta'     => array(
						'_via'      => 'gutenberg',
						'_selector' => array(
							'type'  => 'CssSelector',
							'value' => '#foo',
						),
					),
				) );
				$this->assertInternalType( 'int', $comment_id );
				$this->assertGreaterThan( 0, $comment_id );
			}
		}
		wp_delete_post( $post_id, true );

		$query       = new WP_Comment_Query();
		$comment_ids = $query->query( array(
			'fields'       => 'ids',
			'post_parent'  => $post_id,
			'cache_domain' => 'annotations',
			'type'         => array( 'annotation', 'admin_annotation' ),
			'status'       => 'any',
			'number'       => 0,
		) );

		$this->assertEmpty( $comment_ids );
	}
}
