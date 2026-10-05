<?php
/**
 * Tests for the preloading of the entity fields.
 *
 * @package gutenberg
 *
 * @covers ::_gutenberg_get_post_type_fields_preload_paths
 * @covers ::_gutenberg_get_site_editor_screen_post_types
 * @covers ::_gutenberg_get_site_fields_preload_paths
 * @covers ::_gutenberg_preload_entity_fields
 * @covers ::_gutenberg_get_route_post_types
 * @covers ::_gutenberg_preload_route_entity_fields
 */
class Tests_Preload_Entity_Fields extends WP_UnitTestCase {

	/**
	 * The inline scripts of `wp-api-fetch` before a test runs. The WordPress
	 * test environment registers some of its own, and `wp_scripts()` outlives
	 * a test, so a preload is measured against them and undone afterwards.
	 *
	 * @var array|false
	 */
	private $api_fetch_inline_scripts;

	/**
	 * Sets up each test: fields are registered for a page and for the site,
	 * so the preloaded responses have fields to serve.
	 */
	public function set_up() {
		parent::set_up();
		$this->api_fetch_inline_scripts = wp_scripts()->get_data( 'wp-api-fetch', 'after' );
		add_action( 'fields_api_init', array( __CLASS__, 'register_fields' ) );
		self::reset_registry();
	}

	public function tear_down() {
		unset( $_GET['p'] );
		wp_scripts()->add_data( 'wp-api-fetch', 'after', $this->api_fetch_inline_scripts );
		remove_action( 'fields_api_init', array( __CLASS__, 'register_fields' ) );
		self::reset_registry();
		parent::tear_down();
	}

	/**
	 * Registers a field for pages and one for the site.
	 *
	 * @param Gutenberg_Fields_Registry $registry The registry.
	 */
	public static function register_fields( $registry ) {
		$registry->register(
			'test-plugin',
			'postType',
			'page',
			array(
				array(
					'id'    => 'color',
					'type'  => 'text',
					'label' => 'Color',
				),
			)
		);
		$registry->register(
			'test-plugin',
			'root',
			'site',
			array(
				array(
					'id'    => 'tagline',
					'type'  => 'text',
					'label' => 'Tagline',
				),
			)
		);
	}

	/**
	 * Resets the registry: drops the singleton instance, so the next
	 * get_instance() creates an empty registry and its first read fires
	 * `fields_api_init` again.
	 */
	private static function reset_registry() {
		$instance = new ReflectionProperty( Gutenberg_Fields_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );
	}

	/**
	 * Returns the inline script the preload added to `wp-api-fetch`, empty
	 * when it added none.
	 *
	 * @return string The inline script.
	 */
	private function get_preloaded_inline_script() {
		$before = false === $this->api_fetch_inline_scripts ? array() : (array) $this->api_fetch_inline_scripts;
		$after  = wp_scripts()->get_data( 'wp-api-fetch', 'after' );
		$after  = false === $after ? array() : (array) $after;

		return implode( '', array_slice( $after, count( $before ) ) );
	}

	/**
	 * The post editor preloads the fields of the edited post type, with the
	 * path the `getFieldsConfig` core data resolver requests.
	 */
	public function test_the_post_editor_preloads_the_fields_of_the_post_type() {
		$post    = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		$context = new WP_Block_Editor_Context( array( 'post' => $post ) );

		$paths = apply_filters( 'block_editor_rest_api_preload_paths', array(), $context );

		$this->assertContains( '/wp/v2/fields?kind=postType&name=page', $paths );
	}

	/**
	 * The preloaded path serves the fields of the post type.
	 */
	public function test_the_preloaded_fields_path_serves_the_fields() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$post    = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		$context = new WP_Block_Editor_Context( array( 'post' => $post ) );
		$paths   = _gutenberg_preload_entity_fields( array(), $context );

		$preloaded = array_reduce( $paths, 'rest_preload_api_request', array() );

		$this->assertSame( 'page', $preloaded[ $paths[0] ]['body']['name'] );
		$this->assertContains( 'color', wp_list_pluck( $preloaded[ $paths[0] ]['body']['fields'], 'id' ) );
	}

	/**
	 * The site editor preloads the fields of the post types its screen lists,
	 * from the `p` query arg.
	 *
	 * @dataProvider data_site_editor_screens
	 *
	 * @param string   $path       The `p` query arg.
	 * @param string[] $post_types The post types whose fields are preloaded.
	 */
	public function test_the_site_editor_preloads_the_fields_of_its_screen( $path, $post_types ) {
		$_GET['p'] = $path;
		$context   = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );

		$paths = _gutenberg_preload_entity_fields( array(), $context );
		unset( $_GET['p'] );

		$expected = array();
		foreach ( $post_types as $post_type ) {
			$expected[] = '/wp/v2/fields?kind=postType&name=' . $post_type;
		}
		$this->assertSame( $expected, $paths );
	}

	/**
	 * Data provider for test_the_site_editor_preloads_the_fields_of_its_screen().
	 *
	 * @return array[]
	 */
	public function data_site_editor_screens() {
		return array(
			'pages'         => array( '/page', array( 'page' ) ),
			'page'          => array( '/page/12', array( 'page' ) ),
			'templates'     => array( '/template', array( 'wp_template' ) ),
			'template'      => array( '/wp_template/emptytheme//index', array( 'wp_template' ) ),
			'patterns'      => array( '/pattern', array( 'wp_block', 'wp_template_part' ) ),
			'pattern'       => array( '/wp_block/12', array( 'wp_block' ) ),
			'template part' => array( '/wp_template_part/emptytheme//header', array( 'wp_template_part' ) ),
			'root'          => array( '/', array() ),
			'styles'        => array( '/styles', array() ),
			'navigation'    => array( '/navigation', array() ),
		);
	}

	/**
	 * The site editor preloads the fields of the site on its identity screen,
	 * with the path the `getFieldsConfig` core data resolver requests.
	 */
	public function test_the_site_editor_preloads_the_fields_of_the_site_on_the_identity_screen() {
		$_GET['p'] = '/identity';
		$context   = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );

		$paths = _gutenberg_preload_entity_fields( array(), $context );

		$this->assertSame( array( '/wp/v2/fields?kind=root&name=site' ), $paths );
	}

	/**
	 * The post editor has no identity screen, whatever its `p` query arg.
	 */
	public function test_the_post_editor_does_not_preload_the_fields_of_the_site() {
		$_GET['p'] = '/identity';
		$post      = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		$context   = new WP_Block_Editor_Context(
			array(
				'name' => 'core/edit-post',
				'post' => $post,
			)
		);

		$paths = _gutenberg_preload_entity_fields( array(), $context );

		$this->assertSame( array( '/wp/v2/fields?kind=postType&name=page' ), $paths );
	}

	/**
	 * The site editor preloads the fields of the edited post, once, next to
	 * those of its screen.
	 */
	public function test_the_site_editor_preloads_the_fields_of_the_edited_post() {
		$post      = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		$_GET['p'] = '/page';
		$context   = new WP_Block_Editor_Context(
			array(
				'name' => 'core/edit-site',
				'post' => $post,
			)
		);

		$paths = _gutenberg_preload_entity_fields( array(), $context );
		unset( $_GET['p'] );

		$this->assertSame( array( '/wp/v2/fields?kind=postType&name=page' ), $paths );
	}

	/**
	 * Other editors, a post editor context without a post, and a site editor
	 * screen that lists no post fields are left untouched.
	 */
	public function test_other_editors_do_not_preload_the_fields() {
		$site_editor = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );
		$no_post     = new WP_Block_Editor_Context( array( 'name' => 'core/edit-post' ) );
		$widgets     = new WP_Block_Editor_Context( array( 'name' => 'core/edit-widgets' ) );

		$this->assertSame( array(), _gutenberg_preload_entity_fields( array(), $site_editor ) );
		$this->assertSame( array(), _gutenberg_preload_entity_fields( array(), $no_post ) );
		$this->assertSame( array(), _gutenberg_preload_entity_fields( array(), $widgets ) );
	}

	/**
	 * A route of the extensible site editor, or of the media editor page,
	 * preloads the fields of the post types its screen shows.
	 *
	 * @dataProvider data_routes_and_their_post_types
	 *
	 * @param string   $path       The `p` query arg.
	 * @param string[] $post_types The post types whose fields are preloaded.
	 */
	public function test_a_route_preloads_the_fields_of_its_post_types( $path, $post_types ) {
		$_GET['p'] = $path;

		$this->assertSame( $post_types, _gutenberg_get_route_post_types() );
	}

	/**
	 * Data provider for test_a_route_preloads_the_fields_of_its_post_types().
	 *
	 * @return array[]
	 */
	public function data_routes_and_their_post_types() {
		return array(
			'posts'                 => array( '/types/post', array( 'post' ) ),
			'post list'             => array( '/types/page/list/all', array( 'page' ) ),
			'post editor'           => array( '/types/page/edit/12', array( 'page' ) ),
			'new post'              => array( '/types/page/new', array( 'page' ) ),
			'custom post type'      => array( '/types/acme_book/list/all', array( 'acme_book' ) ),
			'a list with a search'  => array( '/types/page/list/all?page=2', array( 'page' ) ),
			'templates'             => array( '/templates', array( 'wp_template' ) ),
			'template list'         => array( '/templates/list/all', array( 'wp_template' ) ),
			'template parts'        => array( '/template-parts', array( 'wp_template_part' ) ),
			'template part list'    => array( '/template-parts/list/header', array( 'wp_template_part' ) ),
			'patterns'              => array( '/patterns', array( 'wp_block' ) ),
			'pattern list'          => array( '/patterns/list/user', array( 'wp_block' ) ),
			'navigation'            => array( '/navigation', array( 'wp_navigation' ) ),
			'navigation list'       => array( '/navigation/list', array( 'wp_navigation' ) ),
			'media editor'          => array( '/media-editor/12', array( 'attachment' ) ),
			'home'                  => array( '/', array() ),
			'styles'                => array( '/styles', array() ),
			'a post type-less type' => array( '/types', array() ),
			'no route'              => array( '', array() ),
		);
	}

	/**
	 * The fields of the post type reach the page as a preloading middleware of
	 * `api-fetch`, next to the one the page prints itself.
	 */
	public function test_a_route_prints_the_preloaded_fields() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$_GET['p'] = '/types/page/list/all';

		_gutenberg_preload_route_entity_fields();
		$script = $this->get_preloaded_inline_script();

		$this->assertStringContainsString( 'wp.apiFetch.createPreloadingMiddleware(', $script );
		// The path is a key of the JSON the middleware receives, so its
		// slashes are escaped.
		$this->assertStringContainsString( 'fields?kind=postType&name=page', $script );
		$this->assertStringContainsString( '"body"', $script );
	}

	/**
	 * The identity route preloads the fields of the site, which only the
	 * users who manage the options can read.
	 */
	public function test_the_identity_route_prints_the_preloaded_fields_of_the_site() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$_GET['p'] = '/identity';

		_gutenberg_preload_route_entity_fields();
		$script = $this->get_preloaded_inline_script();

		$this->assertStringContainsString( 'fields?kind=root&name=site', $script );
		$this->assertStringContainsString( 'tagline', $script );
	}

	/**
	 * The identity route leaves the request to the client for a user who
	 * cannot read the fields of the site, rather than preloading the error.
	 */
	public function test_the_identity_route_preloads_nothing_for_a_user_who_cannot_read_the_site_fields() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$_GET['p'] = '/identity';

		_gutenberg_preload_route_entity_fields();

		$this->assertSame( '', $this->get_preloaded_inline_script() );
	}

	/**
	 * A route that shows no post fields prints nothing.
	 */
	public function test_a_route_without_post_fields_preloads_nothing() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$_GET['p'] = '/styles';

		_gutenberg_preload_route_entity_fields();

		$this->assertSame( '', $this->get_preloaded_inline_script() );
	}

	/**
	 * A post type that is not registered preloads nothing, so a route naming
	 * one prints no middleware at all.
	 */
	public function test_an_unregistered_post_type_preloads_nothing() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$_GET['p'] = '/types/acme_not_registered/list/all';

		$this->assertSame( array(), _gutenberg_get_post_type_fields_preload_paths( _gutenberg_get_route_post_types() ) );

		_gutenberg_preload_route_entity_fields();

		$this->assertSame( '', $this->get_preloaded_inline_script() );
	}
}
