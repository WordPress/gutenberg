<?php

if ( is_multisite() ) :

/**
 * @group multisite
 */
class Tests_Multisite_IsEmailAddressUnsafe extends WP_UnitTestCase {
	public function test_string_domain_list_should_be_split_on_line_breaks() {
		update_site_option( 'banned_email_domains', "foo.com\nbar.org\nbaz.gov" );
		$this->assertTrue( is_email_address_unsafe( 'foo@bar.org' ) );
		$this->assertFalse( is_email_address_unsafe( 'foo@example.org' ) );
	}

	/**
	 * @dataProvider data_unsafe
	 * @ticket 25046
	 * @ticket 21570
	 */
	public function test_unsafe_emails( $banned, $email ) {
		update_site_option( 'banned_email_domains', $banned );
		$this->assertTrue( is_email_address_unsafe( $email ) );
	}

	/**
	 * @dataProvider data_safe
	 * @ticket 25046
	 * @ticket 21570
	 */
	public function test_safe_emails( $banned, $email ) {
		update_site_option( 'banned_email_domains', $banned );
		$this->assertFalse( is_email_address_unsafe( $email ) );
	}

	public function data_unsafe() {
		return array(
			// 25046
			'case_insensitive_1' => array(
				array( 'baR.com' ),
				'test@Bar.com',
			),
			'case_insensitive_2' => array(
				array( 'baR.com' ),
				'tEst@bar.com',
			),
			'case_insensitive_3' => array(
				array( 'barfoo.COM' ),
				'test@barFoo.com',
			),
			'case_insensitive_4' => array(
				array( 'baR.com' ),
				'tEst@foo.bar.com',
			),
			'case_insensitive_5' => array(
				array( 'BAZ.com' ),
				'test@baz.Com',
			),


			// 21570
			array(
				array( 'bar.com', 'foo.co' ),
				'test@bar.com',
			),
			'subdomain_1' => array(
				array( 'bar.com', 'foo.co' ),
				'test@foo.bar.com',
			),
			array(
				array( 'bar.com', 'foo.co' ),
				'test@foo.co',
			),
			'subdomain_2' => array(
				array( 'bar.com', 'foo.co' ),
				'test@subdomain.foo.co',
			),
		);
	}

	public function data_safe() {
		return array(
			// 25046
			array(
				array( 'baR.com', 'Foo.co', 'barfoo.COM', 'BAZ.com' ),
				'test@Foobar.com',
			),
			array(
				array( 'baR.com', 'Foo.co', 'barfoo.COM', 'BAZ.com' ),
				'test@Foo-bar.com',
			),
			array(
				array( 'baR.com', 'Foo.co', 'barfoo.COM', 'BAZ.com' ),
				'tEst@foobar.com',
			),
			array(
				array( 'baR.com', 'Foo.co', 'barfoo.COM', 'BAZ.com' ),
				'test@Subdomain.Foo.com',
			),
			array(
				array( 'baR.com', 'Foo.co', 'barfoo.COM', 'BAZ.com' ),
				'test@feeBAz.com',
			),

			// 21570
			array(
				array( 'bar.com', 'foo.co' ),
				'test@foobar.com',
			),
			array(
				array( 'bar.com', 'foo.co' ),
				'test@foo-bar.com',
			),
			array(
				array( 'bar.com', 'foo.co' ),
				'test@foo.com',
			),
			array(
				array( 'bar.com', 'foo.co' ),
				'test@subdomain.foo.com',
			),
		);
	}
}

endif;
