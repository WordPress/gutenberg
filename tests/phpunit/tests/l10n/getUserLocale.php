<?php

/**
 * @group l10n
 * @group i18n
 */
class Tests_Get_User_Locale extends WP_UnitTestCase {
	protected $user_id;

	public function setUp() {
		parent::setUp();

		$this->user_id = $this->factory()->user->create( array(
			'role'   => 'administrator',
			'locale' => 'de_DE',
		) );

		wp_set_current_user( $this->user_id );
	}

	public function tearDown() {
		delete_user_meta( $this->user_id, 'locale' );
		set_current_screen( 'front' );

		parent::tearDown();
	}

	public function test_user_locale_property() {
		set_current_screen( 'dashboard' );
		$this->assertSame( 'de_DE', get_user_locale() );
		$this->assertSame( get_user_by( 'id', $this->user_id )->locale, get_user_locale() );
	}

	public function test_update_user_locale() {
		set_current_screen( 'dashboard' );
		update_user_meta( $this->user_id, 'locale', 'fr_FR' );
		$this->assertSame( 'fr_FR', get_user_locale() );
	}

	public function test_returns_site_locale_if_empty() {
		set_current_screen( 'dashboard' );
		update_user_meta( $this->user_id, 'locale', '' );
		$this->assertSame( get_locale(), get_user_locale() );
	}

	public function test_returns_correct_user_locale() {
		set_current_screen( 'dashboard' );
		$this->assertSame( 'de_DE', get_user_locale() );
	}

	public function test_returns_correct_user_locale_on_frontend() {
		$this->assertSame( 'de_DE', get_user_locale() );
	}

	public function test_site_locale_is_not_affected() {
		set_current_screen( 'dashboard' );
		$this->assertSame( 'en_US', get_locale() );
	}

	public function test_site_locale_is_not_affected_on_frontend() {
		$this->assertSame( 'en_US', get_locale() );
	}

	public function test_user_locale_is_same_across_network() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' requires multisite' );
		}

		$user_locale = get_user_locale();

		switch_to_blog( self::factory()->blog->create() );
		$user_locale_2 = get_user_locale();
		restore_current_blog();

		$this->assertSame( 'de_DE', $user_locale );
		$this->assertSame( $user_locale, $user_locale_2 );
	}
}
