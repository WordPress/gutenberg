<?php

/**
 * A factory for making WordPress data with a cross-object type API.
 *
 * Tests should use this factory to generate test fixtures.
 */
class WP_UnitTest_Factory {

	/**
	 * @var WP_UnitTest_Factory_For_Post
	 */
	public $post;

	/**
	 * @var WP_UnitTest_Factory_For_Attachment
	 */
	public $attachment;

	/**
	 * @var WP_UnitTest_Factory_For_Comment
	 */
	public $comment;

	/**
	 * @var WP_UnitTest_Factory_For_User
	 */
	public $user;

	/**
	 * @var WP_UnitTest_Factory_For_Term
	 */
	public $term;

	/**
	 * @var WP_UnitTest_Factory_For_Term
	 */
	public $category;

	/**
	 * @var WP_UnitTest_Factory_For_Term
	 */
	public $tag;

	/**
	 * @since 4.6.0
	 * @var WP_UnitTest_Factory_For_Bookmark
	 */
	public $bookmark;

	/**
	 * @var WP_UnitTest_Factory_For_Blog
	 */
	public $blog;

	/**
	 * @var WP_UnitTest_Factory_For_Network
	 */
	public $network;

	function __construct() {
		$this->post = new WP_UnitTest_Factory_For_Post( $this );
		$this->attachment = new WP_UnitTest_Factory_For_Attachment( $this );
		$this->comment = new WP_UnitTest_Factory_For_Comment( $this );
		$this->user = new WP_UnitTest_Factory_For_User( $this );
		$this->term = new WP_UnitTest_Factory_For_Term( $this );
		$this->category = new WP_UnitTest_Factory_For_Term( $this, 'category' );
		$this->tag = new WP_UnitTest_Factory_For_Term( $this, 'post_tag' );
		$this->bookmark = new WP_UnitTest_Factory_For_Bookmark( $this );
		if ( is_multisite() ) {
			$this->blog = new WP_UnitTest_Factory_For_Blog( $this );
			$this->network = new WP_UnitTest_Factory_For_Network( $this );
		}
	}
}
