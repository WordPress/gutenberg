<?php
/**
 * Annotation Test Object Factory
 *
 * @package gutenberg
 */

/**
 * Annotation test object factory.
 */
class Annotation_Test_Objects {
	/**
	 * Test case.
	 *
	 * @var WP_UnitTestCase
	 */
	protected $case;

	/**
	 * Constructor.
	 *
	 * @param WP_UnitTestCase $case Test case.
	 */
	public function __construct( $case ) {
		$this->case = $case;
	}

	/**
	 * Creates a user.
	 *
	 * @param  string $with_role With role.
	 *
	 * @return WP_User           New user.
	 */
	public function create_user( $with_role ) {
		$user = $this->case->factory->user->create_and_get( array( 'role' => $with_role ) );

		$this->case->assertTrue( $user instanceof WP_User && $user->ID );

		return $user;
	}

	/**
	 * Creates a post.
	 *
	 * @param  int    $by_user_id  By user ID.
	 * @param  string $with_status With status.
	 *
	 * @return WP_Post             New post.
	 */
	public function create_post( $by_user_id, $with_status = 'publish' ) {
		$post = $this->case->factory->post->create_and_get( array(
			'post_type'   => 'post',
			'post_author' => $by_user_id,
			'post_status' => $with_status,
		) );

		$this->case->assertTrue( $post instanceof WP_Post && $post->ID );

		return $post;
	}

	/**
	 * Creates an annotation.
	 *
	 * @param  array $args {
	 *     How to create annotation.
	 *
	 *     @type int    $in_post_id  In post ID.
	 *     @type int    $by_user_id  By user ID.
	 *     @type int    $in_reply_to Optional parent ID. Defaults to `0`.
	 *     @type string $with_status Optional status. Defaults to `1`.
	 * }
	 * @return WP_Annotation         New annotation.
	 */
	public function create_annotation( $args ) {
		$default_args = array(
			'in_post_id'  => 0,
			'by_user_id'  => 0,
			'in_reply_to' => 0,
			'with_status' => '1',
		);
		$args         = wp_parse_args( $args, $default_args );

		$comment    = $this->case->factory->comment->create_and_get( array(
			'comment_type'     => get_default_annotation_type(),
			'comment_post_ID'  => $args['in_post_id'],
			'user_id'          => $args['by_user_id'],
			'comment_parent'   => $args['in_reply_to'],
			'comment_approved' => $args['with_status'],
			'comment_content'  => 'hello world',
			'comment_meta'     => array(
				'_via'      => 'gutenberg',
				'_selector' => array(
					'type'  => 'CssSelector',
					'value' => '#foo > .bar',
				),
			),
		) );
		$annotation = get_annotation( $comment );

		$this->case->assertTrue( $annotation instanceof WP_Annotation && $annotation->comment_ID );

		return $annotation;
	}

	/**
	 * Creates an associative array of users.
	 *
	 * @param  array|null $with_roles Optional array of role names. Default is all roles.
	 *
	 * @return array                  Associative array of {@see WP_User} objects.
	 */
	public function create_users( $with_roles = null ) {
		$users = array();

		if ( ! isset( $with_roles ) ) {
			$with_roles = $this->case->utils->roles;
		}

		foreach ( $with_roles as $with_role ) {
			if ( 'anonymous' === $with_role ) {
				$users[ $with_role ] = new WP_User( 0 );
			} else {
				$users[ $with_role ] = $this->create_user( $with_role );
			}
		}

		$this->case->assertNotEmpty( $users );

		return $users;
	}

	/**
	 * Creates an associative array of posts.
	 *
	 * @param  WP_User[] $by_users      An array of post authors.
	 * @param  string[]  $with_statuses An array of post statuses.
	 *
	 * @return array                    Associative array {@see WP_Post} objects.
	 */
	public function create_posts( $by_users, $with_statuses = array( 'publish' ) ) {
		$posts = array();

		foreach ( $by_users as $by_user ) {
			$by_user_role = $this->case->utils->get_user_role( $by_user );

			if ( 'subscriber' === $by_user_role || 'anonymous' === $by_user_role ) {
				continue; // Not an author user.
			}

			foreach ( $with_statuses as $with_status ) {
				$posts[ $by_user->ID ][ $with_status ] = $this->create_post( $by_user->ID, $with_status );

				if ( 'trash' === $with_status ) {
					$id = $posts[ $by_user->ID ][ $with_status ]->ID;
					update_post_meta( $id, '_wp_trash_meta_status', 'publish' );
				}
			}
		}

		$this->case->assertNotEmpty( $posts );

		return $posts;
	}

	/**
	 * Creates an associative array of annotations.
	 *
	 * @param  array $args {
	 *     How to create annotations.
	 *
	 *     @type array     $in_posts      Collection of posts to annotate.
	 *     @type WP_User[] $by_users      An array of annotation authors.
	 *     @type int       $in_reply_to   Collection of parent annotations.
	 *     @type string[]  $with_statuses An array of annotation statuses.
	 * }
	 * @return array Associative array of {@see WP_Annotation} objects.
	 */
	public function create_annotations( $args ) {
		$default_args = array(
			'in_posts'      => array(),
			'by_users'      => array(),
			'in_reply_to'   => array(),
			'with_statuses' => array( '1' ),
		);
		$args         = wp_parse_args( $args, $default_args );
		$annotations  = array();

		foreach ( $args['in_posts'] as $in_post_by_author_id => $in_posts_with_statuses ) {
			foreach ( $in_posts_with_statuses as $in_post_with_status => $in_post ) {
				foreach ( $args['by_users'] as $by_user ) {

					$by_user_role = $this->case->utils->get_user_role( $by_user );

					if ( 'subscriber' === $by_user_role || 'anonymous' === $by_user_role ) {
						continue; // Not an author user.
					}

					foreach ( $args['with_statuses'] as $with_status ) {

						if ( ! empty( $args['in_reply_to'][ $in_post->ID ][ $by_user->ID ][ $with_status ] ) ) {
							$in_reply_to_id = $args['in_reply_to'][ $in_post->ID ][ $by_user->ID ][ $with_status ]->comment_ID;
						} else {
							$in_reply_to_id = 0; // Top-level annotation.
						}

						$annotations[ $in_post->ID ][ $by_user->ID ][ $with_status ]
							= $this->create_annotation( array(
								'in_post_id'  => $in_post->ID,
								'by_user_id'  => $by_user->ID,
								'in_reply_to' => $in_reply_to_id,
								'with_status' => $with_status,
							) );

						if ( 'trash' === $with_status ) {
							$id = $annotations[ $in_post->ID ][ $by_user->ID ][ $with_status ]->comment_ID;
							update_comment_meta( $id, '_wp_trash_meta_status', '1' );
						}
					}
				}
			}
		}

		$this->case->assertNotEmpty( $annotations );

		return $annotations;
	}
}
