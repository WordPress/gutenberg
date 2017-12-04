<?php
/**
 * WP_Annotation_Caps Tests
 *
 * @package gutenberg
 */

require_once dirname( __FILE__ ) . '/includes/class-annotation-test-objects.php';
require_once dirname( __FILE__ ) . '/includes/class-annotation-test-utils.php';

/**
 * Tests annotation capabilities.
 */
class Annotation_Caps_Test extends WP_UnitTestCase {
	/**
	 * Magic first-access properties.
	 *
	 * @param  string $property Property name.
	 * @return mixed            Property value.
	 */
	public function __get( $property ) {
		if ( 'objects' === $property ) {
			$this->objects = new Annotation_Test_Objects( $this );
			return $this->objects;
		} elseif ( 'utils' === $property ) {
			$this->utils = new Annotation_Test_Utils( $this );
			return $this->utils;
		}
		return parent::__get( $property );
	}

	/**
	 * Check that we have necessary hooks.
	 */
	public function test_has_hooks() {
		$this->assertNotEmpty( has_filter( 'map_meta_cap', 'WP_Annotation_Caps::on_map_meta_cap' ) );
	}

	/**
	 * Test standard meta-caps.
	 */
	public function test_standard_meta_caps() {
		foreach ( $this->generate_standard_meta_cap_tests() as $key => $test ) {
			list ( $expecting, $user, $cap, $annotation ) = $test;
			$this->assertSame( $expecting, $user->has_cap( $cap, $annotation ? $annotation->comment_ID : null ), $key );
		}
	}

	/**
	 * Test meta-caps that check a post ID.
	 */
	public function test_post_check_meta_caps() {
		foreach ( $this->generate_post_check_meta_cap_tests() as $key => $test ) {
			list ( $expecting, $user, $cap, $post, $type ) = $test;
			$this->assertSame( $expecting, $user->has_cap( $cap, $post ? $post->ID : null, $type ), $key );
		}
	}

	/**
	 * Test other pseudo-caps.
	 */
	public function test_other_pseudo_caps() {
		foreach ( $this->generate_other_pseudo_cap_tests() as $key => $test ) {
			list ( $expecting, $user, $cap, $type ) = $test;
			$this->assertSame( $expecting, $user->has_cap( $cap, $type ), $key );
		}
	}

	/*
	 * --- Test generators -------------------------------------------------------
	 */

	/**
	 * Generates tests for {@see test_standard_meta_caps()}.
	 *
	 * @return array Test arrays.
	 */
	protected function generate_standard_meta_cap_tests() {
		$tests   = array();
		$counter = 0;

		$users                  = $this->objects->create_users();
		$posts                  = $this->objects->create_posts( $users, array( 'publish', 'trash' ) );
		$annotations            = $this->objects->create_annotations( array(
			'in_posts'      => $posts,
			'by_users'      => $users,
			'with_statuses' => array( '1', 'trash' ),
		) );
		$nonexistent_annotation = new WP_Annotation( (object) array(
			'comment_ID'   => 0,
			'comment_type' => get_default_annotation_type(),
		) );
		$comment                = $this->factory->comment->create_and_get(
			array( 'comment_post_ID' => $posts[ $users['editor']->ID ]['publish']->ID )
		);

		foreach ( $users as $user ) {
			$user_role = $this->utils->get_user_role( $user );

			// Test all comments.
			foreach ( $annotations as $in_post_id => $by_author_ids ) {
				foreach ( $by_author_ids as $by_author_id => $with_statuses ) {
					$in_post             = get_post( $in_post_id );
					$in_post_with_status = $in_post->post_status;

					$in_post_by_author      = new WP_User( $in_post->post_author );
					$in_post_by_author_role = $this->utils->get_user_role( $in_post_by_author );

					$by_author      = new WP_User( $by_author_id );
					$by_author_role = $this->utils->get_user_role( $by_author );

					foreach ( $with_statuses as $with_status => $annotation ) {
						foreach ( $this->utils->standard_meta_caps as $cap ) {
							$key  = "{$user_role} can {$cap},";
							$key .= " in post by {$in_post_by_author_role} with status={$in_post_with_status},";
							$key .= " annotated by {$by_author_role} with status={$with_status}";

							switch ( $user_role ) {
								case 'administrator':
								case 'editor':
									$can           = 'trash' !== $in_post_with_status;
									$tests[ $key ] = array( $can, $user, $cap, $annotation );
									break;

								case 'author':
								case 'contributor':
									$can = 'trash' !== $in_post_with_status
										&& $user->ID === $in_post_by_author->ID
										&& ( ! in_array( $with_status, array( 0, 'spam', 'trash' ), true )
											|| ( 'trash' === $with_status && $user->ID === $by_author->ID ) );

									if ( 'read_annotation' !== $cap ) {
										$can = $can && $user->ID === $by_author->ID;
									}

									$tests[ $key ] = array( $can, $user, $cap, $annotation );
									break;

								case 'subscriber':
								case 'anonymous':
								default:
									$can           = false;
									$tests[ $key ] = array( $can, $user, $cap, $annotation );
									break;
							}
							$counter++;
						}
					}
				}
			}

			// Test additional scenarios to expand coverage.
			foreach ( $this->utils->standard_meta_caps as $cap ) {
				// Test missing comment ID arg.
				$key           = "{$user_role} can {$cap} with missing comment ID arg";
				$tests[ $key ] = array( false, $user, $cap, null );
				$counter++;

				// Test empty comment ID arg.
				$key           = "{$user_role} can {$cap} with empty comment ID arg";
				$tests[ $key ] = array( false, $user, $cap, $nonexistent_annotation );
				$counter++;

				// Test a normal comment type.
				$key           = "{$user_role} can {$cap} with normal comment type";
				$tests[ $key ] = array( false, $user, $cap, $comment );
				$counter++;
			}
		}

		$this->assertSame( $counter, count( $tests ) );

		return $tests;
	}

	/**
	 * Generates tests for {@see test_post_check_meta_caps()}.
	 *
	 * @return array Test arrays.
	 */
	protected function generate_post_check_meta_cap_tests() {
		$tests   = array();
		$counter = 0;

		$users      = $this->objects->create_users();
		$posts      = $this->objects->create_posts( $users, array( 'publish', 'trash' ) );
		$post_no_id = new WP_Post( (object) array( 'ID' => 0 ) );

		foreach ( $users as $user ) {
			$user_role = $this->utils->get_user_role( $user );

			// Test all posts.
			foreach ( $posts as $by_author_id => $with_statuses ) {
				$by_author      = new WP_User( $by_author_id );
				$by_author_role = $this->utils->get_user_role( $by_author );

				foreach ( $with_statuses as $with_status => $post ) {
					foreach ( $this->utils->post_check_meta_caps as $cap ) {
						$key  = "{$user_role} can {$cap},";
						$key .= " in post by {$by_author_role} with status={$with_status}";

						switch ( $user_role ) {
							case 'administrator':
							case 'editor':
								$can           = 'trash' !== $with_status;
								$tests[ $key ] = array( $can, $user, $cap, $post, null );
								break;

							case 'author':
							case 'contributor':
								$can           = 'trash' !== $with_status && $user->ID === $by_author->ID;
								$tests[ $key ] = array( $can, $user, $cap, $post, null );
								break;

							case 'subscriber':
							case 'anonymous':
							default:
								$can           = false;
								$tests[ $key ] = array( $can, $user, $cap, $post, null );
								break;
						}
						$counter++;
					}
				}
			}

			// Test additional scenarios to expand coverage.
			foreach ( $this->utils->post_check_meta_caps as $cap ) {
				// Test missing post ID arg.
				$key           = "{$user_role} can {$cap} with missing post ID arg";
				$can           = 'read_annotations' === $cap;
				$can           = $can && ! in_array( $user_role, array( 'subscriber', 'anonymous' ), true );
				$tests[ $key ] = array( $can, $user, $cap, null, null );
				$counter++;

				// Test empty post ID arg.
				$key           = "{$user_role} can {$cap} with empty post ID arg";
				$tests[ $key ] = array( false, $user, $cap, $post_no_id, null );
				$counter++;

				// Test empty post ID arg.
				$key           = "{$user_role} can {$cap} with normal comment type";
				$tests[ $key ] = array( false, $user, $cap, $posts[ $users['editor']->ID ]['publish'], 'comment' );
				$counter++;
			}
		}

		$this->assertSame( $counter, count( $tests ) );

		return $tests;
	}

	/**
	 * Generates tests for {@see test_other_pseudo_caps()}.
	 *
	 * @return array Test arrays.
	 */
	protected function generate_other_pseudo_cap_tests() {
		$tests   = array();
		$counter = 0;

		$users = $this->objects->create_users();

		foreach ( $users as $user ) {
			$user_role = $this->utils->get_user_role( $user );

			// Test all pseudo-caps.
			foreach ( $this->utils->other_pseudo_caps as $cap ) {
				$key = "{$user_role} can {$cap}";

				switch ( $user_role ) {
					case 'administrator':
					case 'editor':
						$can           = true;
						$tests[ $key ] = array( $can, $user, $cap, null );
						break;

					case 'author':
						$has_caps      = array(
							'read_annotations',
							'create_annotations',
							'edit_annotations',
							'publish_annotations',
							'edit_published_annotations',
							'delete_annotations',
							'delete_published_annotations',
						);
						$can           = in_array( $cap, $has_caps, true );
						$tests[ $key ] = array( $can, $user, $cap, null );
						break;

					case 'contributor':
						$has_caps      = array(
							'read_annotations',
							'create_annotations',
							'edit_annotations',
							'delete_annotations',
						);
						$can           = in_array( $cap, $has_caps, true );
						$tests[ $key ] = array( $can, $user, $cap, null );
						break;

					case 'subscriber':
					case 'anonymous':
					default:
						$can           = false;
						$tests[ $key ] = array( $can, $user, $cap, null );
						break;
				}
				$counter++;
			}

			// Test additional scenarios to expand coverage.
			foreach ( $this->utils->other_pseudo_caps as $cap ) {
				// Test normal comment type.
				$key           = "{$user_role} can {$cap} with invalid comment type";
				$tests[ $key ] = array( false, $user, $cap, 'comment' );
				$counter++;
			}
		}

		$this->assertSame( $counter, count( $tests ) );

		return $tests;
	}
}
