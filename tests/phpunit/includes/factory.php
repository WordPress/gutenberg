<?php

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
		if ( is_multisite() ) {
			$this->blog = new WP_UnitTest_Factory_For_Blog( $this );
			$this->network = new WP_UnitTest_Factory_For_Network( $this );
		}
	}
}

class WP_UnitTest_Factory_For_Post extends WP_UnitTest_Factory_For_Thing {

	function __construct( $factory = null ) {
		parent::__construct( $factory );
		$this->default_generation_definitions = array(
			'post_status' => 'publish',
			'post_title' => new WP_UnitTest_Generator_Sequence( 'Post title %s' ),
			'post_content' => new WP_UnitTest_Generator_Sequence( 'Post content %s' ),
			'post_excerpt' => new WP_UnitTest_Generator_Sequence( 'Post excerpt %s' ),
			'post_type' => 'post'
		);
	}

	function create_object( $args ) {
		return wp_insert_post( $args );
	}

	function update_object( $post_id, $fields ) {
		$fields['ID'] = $post_id;
		return wp_update_post( $fields );
	}

	function get_object_by_id( $post_id ) {
		return get_post( $post_id );
	}
}

class WP_UnitTest_Factory_For_Attachment extends WP_UnitTest_Factory_For_Post {

	function create_object( $file, $parent = 0, $args = array() ) {
		return wp_insert_attachment( $args, $file, $parent );
	}
}

class WP_UnitTest_Factory_For_User extends WP_UnitTest_Factory_For_Thing {

	function __construct( $factory = null ) {
		parent::__construct( $factory );
		$this->default_generation_definitions = array(
			'user_login' => new WP_UnitTest_Generator_Sequence( 'User %s' ),
			'user_pass' => 'password',
			'user_email' => new WP_UnitTest_Generator_Sequence( 'user_%s@example.org' ),
		);
	}

	function create_object( $args ) {
		return wp_insert_user( $args );
	}

	function update_object( $user_id, $fields ) {
		$fields['ID'] = $user_id;
		return wp_update_user( $fields );
	}

	function get_object_by_id( $user_id ) {
		return new WP_User( $user_id );
	}
}

class WP_UnitTest_Factory_For_Comment extends WP_UnitTest_Factory_For_Thing {

	function __construct( $factory = null ) {
		parent::__construct( $factory );
		$this->default_generation_definitions = array(
			'comment_author' => new WP_UnitTest_Generator_Sequence( 'Commenter %s' ),
			'comment_author_url' => new WP_UnitTest_Generator_Sequence( 'http://example.com/%s/' ),
			'comment_approved' => 1,
			'comment_content' => 'This is a comment'
		);
	}

	function create_object( $args ) {
		return wp_insert_comment( $this->addslashes_deep( $args ) );
	}

	function update_object( $comment_id, $fields ) {
		$fields['comment_ID'] = $comment_id;
		return wp_update_comment( $this->addslashes_deep( $fields ) );
	}

	function create_post_comments( $post_id, $count = 1, $args = array(), $generation_definitions = null ) {
		$args['comment_post_ID'] = $post_id;
		return $this->create_many( $count, $args, $generation_definitions );
	}

	function get_object_by_id( $comment_id ) {
		return get_comment( $comment_id );
	}
}

class WP_UnitTest_Factory_For_Blog extends WP_UnitTest_Factory_For_Thing {

	function __construct( $factory = null ) {
		global $current_site, $base;
		parent::__construct( $factory );
		$this->default_generation_definitions = array(
			'domain' => $current_site->domain,
			'path' => new WP_UnitTest_Generator_Sequence( $base . 'testpath%s' ),
			'title' => new WP_UnitTest_Generator_Sequence( 'Site %s' ),
			'site_id' => $current_site->id,
		);
	}

	function create_object( $args ) {
		global $wpdb;
		$meta = isset( $args['meta'] ) ? $args['meta'] : array();
		$user_id = isset( $args['user_id'] ) ? $args['user_id'] : get_current_user_id();
		// temp tables will trigger db errors when we attempt to reference them as new temp tables
		$suppress = $wpdb->suppress_errors();
		$blog = wpmu_create_blog( $args['domain'], $args['path'], $args['title'], $user_id, $meta, $args['site_id'] );
		$wpdb->suppress_errors( $suppress );
		return $blog;
	}

	function update_object( $blog_id, $fields ) {}

	function get_object_by_id( $blog_id ) {
		return get_blog_details( $blog_id, false );
	}
}


class WP_UnitTest_Factory_For_Network extends WP_UnitTest_Factory_For_Thing {

	function __construct( $factory = null ) {
		parent::__construct( $factory );
		$this->default_generation_definitions = array(
			'domain' => WP_TESTS_DOMAIN,
			'title' => new WP_UnitTest_Generator_Sequence( 'Network %s' ),
			'path' => new WP_UnitTest_Generator_Sequence( '/testpath%s/' ),
			'network_id' => new WP_UnitTest_Generator_Sequence( '%s', 2 ),
			'subdomain_install' => false,
		);
	}

	function create_object( $args ) {
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		if ( ! isset( $args['user'] ) ) {
			$email = WP_TESTS_EMAIL;
		} else {
			$email = get_userdata( $args['user'] )->user_email;
		}

		populate_network( $args['network_id'], $args['domain'], $email, $args['title'], $args['path'], $args['subdomain_install'] );
		return $args['network_id'];
	}

	function update_object( $network_id, $fields ) {}

	function get_object_by_id( $network_id ) {
		return wp_get_network( $network_id );
	}
}

class WP_UnitTest_Factory_For_Term extends WP_UnitTest_Factory_For_Thing {

	private $taxonomy;
	const DEFAULT_TAXONOMY = 'post_tag';

	function __construct( $factory = null, $taxonomy = null ) {
		parent::__construct( $factory );
		$this->taxonomy = $taxonomy ? $taxonomy : self::DEFAULT_TAXONOMY;
		$this->default_generation_definitions = array(
			'name' => new WP_UnitTest_Generator_Sequence( 'Term %s' ),
			'taxonomy' => $this->taxonomy,
			'description' => new WP_UnitTest_Generator_Sequence( 'Term description %s' ),
		);
	}

	function create_object( $args ) {
		$args = array_merge( array( 'taxonomy' => $this->taxonomy ), $args );
		$term_id_pair = wp_insert_term( $args['name'], $args['taxonomy'], $args );
		if ( is_wp_error( $term_id_pair ) )
			return $term_id_pair;
		return $term_id_pair['term_id'];
	}

	function update_object( $term, $fields ) {
		$fields = array_merge( array( 'taxonomy' => $this->taxonomy ), $fields );
		if ( is_object( $term ) )
			$taxonomy = $term->taxonomy;
		$term_id_pair = wp_update_term( $term, $taxonomy, $fields );
		return $term_id_pair['term_id'];
	}

	function add_post_terms( $post_id, $terms, $taxonomy, $append = true ) {
		return wp_set_post_terms( $post_id, $terms, $taxonomy, $append );
	}

	function create_and_get( $args = array(), $generation_definitions = null ) {
		$term_id = $this->create( $args, $generation_definitions );
		$taxonomy = isset( $args['taxonomy'] ) ? $args['taxonomy'] : $this->taxonomy;
		return get_term( $term_id, $taxonomy );
	}

	function get_object_by_id( $term_id ) {
		return get_term( $term_id, $this->taxonomy );
	}
}

abstract class WP_UnitTest_Factory_For_Thing {

	var $default_generation_definitions;
	var $factory;

	/**
	 * Creates a new factory, which will create objects of a specific Thing
	 *
	 * @param object $factory Global factory that can be used to create other objects on the system
	 * @param array $default_generation_definitions Defines what default values should the properties of the object have. The default values
	 * can be generators -- an object with next() method. There are some default generators: {@link WP_UnitTest_Generator_Sequence},
	 * {@link WP_UnitTest_Generator_Locale_Name}, {@link WP_UnitTest_Factory_Callback_After_Create}.
	 */
	function __construct( $factory, $default_generation_definitions = array() ) {
		$this->factory = $factory;
		$this->default_generation_definitions = $default_generation_definitions;
	}

	abstract function create_object( $args );
	abstract function update_object( $object, $fields );

	function create( $args = array(), $generation_definitions = null ) {
		if ( is_null( $generation_definitions ) )
			$generation_definitions = $this->default_generation_definitions;

		$generated_args = $this->generate_args( $args, $generation_definitions, $callbacks );
		$created = $this->create_object( $generated_args );
		if ( !$created || is_wp_error( $created ) )
			return $created;

		if ( $callbacks ) {
			$updated_fields = $this->apply_callbacks( $callbacks, $created );
			$save_result = $this->update_object( $created, $updated_fields );
			if ( !$save_result || is_wp_error( $save_result ) )
				return $save_result;
		}
		return $created;
	}

	function create_and_get( $args = array(), $generation_definitions = null ) {
		$object_id = $this->create( $args, $generation_definitions );
		return $this->get_object_by_id( $object_id );
	}

	abstract function get_object_by_id( $object_id );

	function create_many( $count, $args = array(), $generation_definitions = null ) {
		$results = array();
		for ( $i = 0; $i < $count; $i++ ) {
			$results[] = $this->create( $args, $generation_definitions );
		}
		return $results;
	}

	function generate_args( $args = array(), $generation_definitions = null, &$callbacks = null ) {
		$callbacks = array();
		if ( is_null( $generation_definitions ) )
			$generation_definitions = $this->default_generation_definitions;

		foreach( array_keys( $generation_definitions ) as $field_name ) {
			if ( !isset( $args[$field_name] ) ) {
				$generator = $generation_definitions[$field_name];
				if ( is_scalar( $generator ) )
					$args[$field_name] = $generator;
				elseif ( is_object( $generator ) && method_exists( $generator, 'call' ) ) {
					$callbacks[$field_name] = $generator;
				} elseif ( is_object( $generator ) )
					$args[$field_name] = $generator->next();
				else
					return new WP_Error( 'invalid_argument', 'Factory default value should be either a scalar or an generator object.' );
			}
		}
		return $args;
	}

	function apply_callbacks( $callbacks, $created ) {
		$updated_fields = array();
		foreach( $callbacks as $field_name => $generator ) {
			$updated_fields[$field_name] = $generator->call( $created );
		}
		return $updated_fields;
	}

	function callback( $function ) {
		return new WP_UnitTest_Factory_Callback_After_Create( $function );
	}

	function addslashes_deep($value) {
		if ( is_array( $value ) ) {
			$value = array_map( array( $this, 'addslashes_deep' ), $value );
		} elseif ( is_object( $value ) ) {
			$vars = get_object_vars( $value );
			foreach ($vars as $key=>$data) {
				$value->{$key} = $this->addslashes_deep( $data );
			}
		} elseif ( is_string( $value ) ) {
			$value = addslashes( $value );
		}

		return $value;
	}

}

class WP_UnitTest_Generator_Sequence {
	var $next;
	var $template_string;

	function __construct( $template_string = '%s', $start = 1 ) {
		$this->next = $start;
		$this->template_string = $template_string;
	}

	function next() {
		$generated = sprintf( $this->template_string , $this->next );
		$this->next++;
		return $generated;
	}
}

class WP_UnitTest_Factory_Callback_After_Create {
	var $callback;

	function __construct( $callback ) {
		$this->callback = $callback;
	}

	function call( $object ) {
		return call_user_func( $this->callback, $object );
	}
}
