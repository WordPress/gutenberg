<?php

/**
 * Tests get_theme_starter_content().
 *
 * @group themes
 */
class Tests_WP_Theme_Get_Theme_Starter_Content extends WP_UnitTestCase {

	/**
	 * Testing passing an empty array as starter content.
	 */
	function test_add_theme_support_empty() {
		add_theme_support( 'starter-content', array() );
		$starter_content = get_theme_starter_content();

		$this->assertEmpty( $starter_content );
	}

	/**
	 * Testing passing nothing as starter content.
	 */
	function test_add_theme_support_single_param() {
		add_theme_support( 'starter-content' );
		$starter_content = get_theme_starter_content();

		$this->assertEmpty( $starter_content );
	}

	/**
	 * Testing that placeholder starter content gets expanded, that unrecognized placeholders are discarded, and that custom items are recognized.
	 */
	function test_default_content_sections() {
		/*
		 * All placeholder identifiers should be referenced in this sample starter
		 * content and then tested to ensure they get hydrated in the call to
		 * get_theme_starter_content() to ensure that the starter content
		 * placeholder identifiers remain intact in core.
		 */
		$dehydrated_starter_content = array(
			'widgets' => array(
				'sidebar-1' => array(
					'text_business_info',
					'text_about',
					'archives',
					'calendar',
					'categories',
					'meta',
					'recent-comments',
					'recent-posts',
					'search',
					'unknown',
					'meta_custom' => array( 'meta', array(
						'title' => 'Pre-hydrated meta widget.',
					) ),
				),
			),
			'nav_menus' => array(
				'top' => array(
					'name' => 'Menu Name',
					'items' => array(
						'page_home',
						'page_about',
						'page_blog',
						'page_news',
						'page_contact',
						'link_email',
						'link_facebook',
						'link_foursquare',
						'link_github',
						'link_instagram',
						'link_linkedin',
						'link_pinterest',
						'link_twitter',
						'link_yelp',
						'link_youtube',
						'link_unknown',
						'link_custom' => array(
							'title' => 'Custom',
							'url' => 'https://custom.example.com/',
						),
					),
				),
			),
			'posts' => array(
				'home',
				'about',
				'contact',
				'blog',
				'news',
				'homepage-section',
				'unknown',
				'custom' => array(
					'post_type' => 'post',
					'post_title' => 'Custom',
				),
			),
			'options' => array(
				'show_on_front' => 'page',
				'page_on_front' => '{{home}}',
				'page_for_posts' => '{{blog}}',
			),
			'theme_mods' => array(
				'panel_1' => '{{homepage-section}}',
				'panel_2' => '{{about}}',
				'panel_3' => '{{blog}}',
				'panel_4' => '{{contact}}',
			),
		);

		add_theme_support( 'starter-content', $dehydrated_starter_content );

		$hydrated_starter_content = get_theme_starter_content();
		$this->assertSame( $hydrated_starter_content['theme_mods'], $dehydrated_starter_content['theme_mods'] );
		$this->assertSame( $hydrated_starter_content['options'], $dehydrated_starter_content['options'] );
		$this->assertCount( 16, $hydrated_starter_content['nav_menus']['top']['items'], 'Unknown should be dropped, custom should be present.' );
		$this->assertCount( 10, $hydrated_starter_content['widgets']['sidebar-1'], 'Unknown should be dropped.' );

		foreach ( $hydrated_starter_content['widgets']['sidebar-1'] as $widget ) {
			$this->assertInternalType( 'array', $widget );
			$this->assertCount( 2, $widget );
			$this->assertInternalType( 'string', $widget[0] );
			$this->assertInternalType( 'array', $widget[1] );
			$this->assertArrayHasKey( 'title', $widget[1] );
		}

		foreach ( $hydrated_starter_content['nav_menus']['top']['items'] as $nav_menu_item ) {
			$this->assertInternalType( 'array', $nav_menu_item );
			$this->assertTrue( ! empty( $nav_menu_item['object_id'] ) || ! empty( $nav_menu_item['url'] ) );
		}

		foreach ( $hydrated_starter_content['posts'] as $key => $post ) {
			$this->assertInternalType( 'string', $key );
			$this->assertFalse( is_numeric( $key ) );
			$this->assertInternalType( 'array', $post );
			$this->assertArrayHasKey( 'post_type', $post );
			$this->assertArrayHasKey( 'post_title', $post );
		}
	}

	/**
	 * Testing the filter with the text_credits widget.
	 */
	function test_get_theme_starter_content_filter() {

		add_theme_support( 'starter-content',
			array(
				'widgets' => array(
					'sidebar-1' => array(
						'text_about',
					),
				),
			)
		);

		add_filter( 'get_theme_starter_content', array( $this, 'filter_theme_starter_content' ), 10, 2 );
		$starter_content = get_theme_starter_content();

		$this->assertCount( 2, $starter_content['widgets']['sidebar-1'] );
		$this->assertEquals( 'Filtered Widget', $starter_content['widgets']['sidebar-1'][1][1]['title'] );
	}

	/**
	 * Filter the append a widget starter content.
	 *
	 * @param array $content Starter content (hydrated).
	 * @param array $config  Starter content config (pre-hydrated).
	 * @return array Filtered starter content.
	 */
	public function filter_theme_starter_content( $content, $config ) {
		$this->assertInternalType( 'array', $config );
		$this->assertCount( 1, $config['widgets']['sidebar-1'] );
		$content['widgets']['sidebar-1'][] = array( 'text', array(
			'title' => 'Filtered Widget',
			'text'  => 'Custom ',
		) );
		return $content;
	}
}
