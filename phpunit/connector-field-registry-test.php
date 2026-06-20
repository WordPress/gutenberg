<?php
/**
 * Tests for the Connector Fields API.
 *
 * Covers:
 *  - `register_connector_field()` / `unregister_connector_field()`
 *  - `wp_get_connector_field()` / `wp_get_connector_fields()`
 *  - `wp_get_connector_field_value()`
 *  - Back-compat synthesis of the implicit `api_key` field
 *  - Setting-name auto-generation rules
 *  - `_gutenberg_connector_fields_mask()` /
 *    `_gutenberg_connector_fields_resolve_source()`
 *
 * @package gutenberg
 *
 * @covers ::register_connector_field
 * @covers ::unregister_connector_field
 * @covers ::wp_get_connector_field
 * @covers ::wp_get_connector_fields
 * @covers ::wp_get_connector_field_value
 * @covers ::_gutenberg_connector_fields_mask
 * @covers ::_gutenberg_connector_fields_resolve_source
 * @covers ::_gutenberg_connector_fields_synthesize_legacy
 * @covers WP_Connector_Field_Registry
 */
class Tests_Connector_Field_Registry extends WP_UnitTestCase {

	/**
	 * Names of fields registered during the current test, tracked so we can
	 * guarantee tear_down removes them without relying on test order.
	 *
	 * @var array<int, array{0:string, 1:string}>
	 */
	private array $registered = array();

	/**
	 * IDs of connectors registered during the current test, cleaned up in
	 * tear_down so a mid-test failure cannot leak a connector into the next
	 * test (the core connector registry is not reset between tests).
	 *
	 * @var array<int, string>
	 */
	private array $registered_connectors = array();

	public function set_up() {
		parent::set_up();

		// Field reads/exposure run as a privileged admin in production (the
		// Settings REST controller requires manage_options); match that so the
		// per-field auth gate resolves to "allowed" by default.
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		// Start every test with a clean field registry.
		WP_Connector_Field_Registry::set_instance( null );
	}

	public function tear_down() {
		foreach ( $this->registered as [ $connector_id, $field_name ] ) {
			if ( WP_Connector_Field_Registry::get_instance()->is_registered( $connector_id, $field_name ) ) {
				WP_Connector_Field_Registry::get_instance()->unregister( $connector_id, $field_name );
			}
		}
		$this->registered = array();

		foreach ( $this->registered_connectors as $connector_id ) {
			if ( wp_is_connector_registered( $connector_id ) ) {
				WP_Connector_Registry::get_instance()->unregister( $connector_id );
			}
		}
		$this->registered_connectors = array();

		WP_Connector_Field_Registry::set_instance( null );

		parent::tear_down();
	}

	/**
	 * Registers a field and tracks it for automatic cleanup.
	 *
	 * @param string $connector_id Connector ID.
	 * @param string $field_name   Field slug.
	 * @param array  $args         Field args.
	 * @return array|null
	 */
	private function track( string $connector_id, string $field_name, array $args ): ?array {
		$this->registered[] = array( $connector_id, $field_name );
		return register_connector_field( $connector_id, $field_name, $args );
	}

	/**
	 * Registers a connector and tracks it for automatic cleanup.
	 *
	 * @param string $connector_id Connector ID.
	 * @param array  $args         Connector args.
	 * @return array|null
	 */
	private function track_connector( string $connector_id, array $args ): ?array {
		$this->registered_connectors[] = $connector_id;
		return WP_Connector_Registry::get_instance()->register( $connector_id, $args );
	}

	/* ---------------------------------------------------------------------
	 * register_connector_field — happy path
	 * ------------------------------------------------------------------- */

	public function test_register_field_returns_normalised_shape() {
		$field = $this->track(
			'openai',
			'base_url',
			array(
				'control'     => 'url',
				'label'       => 'Server URL',
				'description' => 'Base URL.',
				'placeholder' => 'https://example/v1',
				'default'     => 'https://default/v1',
			)
		);

		$this->assertIsArray( $field );
		$this->assertSame( 'base_url', $field['name'] );
		// `type` defaults to the string data type; `control` carries the UI hint.
		$this->assertSame( 'string', $field['type'] );
		$this->assertSame( 'url', $field['control'] );
		$this->assertSame( 'Server URL', $field['label'] );
		$this->assertSame( 'Base URL.', $field['description'] );
		$this->assertSame( 'https://example/v1', $field['placeholder'] );
		$this->assertSame( 'https://default/v1', $field['default'] );
		$this->assertFalse( $field['sensitive'] );
		$this->assertTrue( $field['show_in_rest'] );
		$this->assertNull( $field['choices'] );
		$this->assertNull( $field['sanitize_callback'] );
		$this->assertNull( $field['auth_callback'] );
		$this->assertNull( $field['env_var_name'] );
		$this->assertNull( $field['constant_name'] );
	}

	public function test_control_defaults_from_data_type() {
		$field = $this->track(
			'openai',
			'enabled',
			array(
				'type'  => 'boolean',
				'label' => 'Enabled',
			)
		);

		// boolean → checkbox, no explicit control needed.
		$this->assertSame( 'boolean', $field['type'] );
		$this->assertSame( 'checkbox', $field['control'] );
	}

	public function test_auto_generated_setting_name_strips_ai_provider_suffix() {
		// OpenAI's connector type is `ai_provider` — the generated setting
		// name must use the shortened `ai` prefix to align with the existing
		// `connectors_ai_openai_api_key` convention.
		$field = $this->track(
			'openai',
			'base_url',
			array(
				'control' => 'url',
				'label'   => 'Server URL',
			)
		);

		$this->assertSame( 'connectors_ai_openai_base_url', $field['setting_name'] );
	}

	public function test_auto_generated_setting_name_uses_type_verbatim_for_non_ai() {
		// Register a fake connector to avoid depending on Akismet's availability.
		$this->track_connector(
			'spam-guardian',
			array(
				'name'           => 'Spam Guardian',
				'type'           => 'spam_filtering',
				'authentication' => array( 'method' => 'none' ),
			)
		);

		$field = $this->track(
			'spam-guardian',
			'threshold',
			array(
				'type'  => 'number',
				'label' => 'Threshold',
			)
		);

		$this->assertSame( 'connectors_spam_filtering_spam_guardian_threshold', $field['setting_name'] );
	}

	public function test_explicit_setting_name_is_preserved() {
		$field = $this->track(
			'openai',
			'base_url',
			array(
				'control'      => 'url',
				'label'        => 'Server URL',
				'setting_name' => 'my_custom_openai_base_url',
			)
		);

		$this->assertSame( 'my_custom_openai_base_url', $field['setting_name'] );
	}

	public function test_checkbox_does_not_require_choices() {
		$field = $this->track(
			'openai',
			'stream_by_default',
			array(
				'type'    => 'boolean',
				'control' => 'checkbox',
				'label'   => 'Stream responses by default',
			)
		);

		$this->assertIsArray( $field );
		$this->assertSame( 'checkbox', $field['control'] );
		$this->assertNull( $field['choices'] );
	}

	public function test_select_choices_become_rest_enum() {
		$field = $this->track(
			'openai',
			'preferred_model',
			array(
				'control' => 'select',
				'label'   => 'Preferred model',
				'choices' => array(
					'gpt-4' => 'GPT-4',
					'gpt-5' => 'GPT-5',
				),
			)
		);

		// A select's choices are exposed as the REST schema `enum`, matching
		// how register_setting() constrains options.
		$this->assertIsArray( $field['show_in_rest'] );
		$this->assertSame(
			array( 'gpt-4', 'gpt-5' ),
			$field['show_in_rest']['schema']['enum']
		);
	}

	/* ---------------------------------------------------------------------
	 * register_connector_field — validation failures
	 * ------------------------------------------------------------------- */

	public function test_rejects_unknown_connector() {
		$this->setExpectedIncorrectUsage( 'WP_Connector_Field_Registry::register' );

		$result = register_connector_field(
			'does-not-exist',
			'base_url',
			array(
				'control' => 'url',
				'label'   => 'URL',
			)
		);

		$this->assertNull( $result );
	}

	public function test_rejects_invalid_field_name() {
		$this->setExpectedIncorrectUsage( 'WP_Connector_Field_Registry::register' );

		$result = register_connector_field(
			'openai',
			'Invalid Name',
			array(
				'control' => 'text',
				'label'   => 'X',
			)
		);

		$this->assertNull( $result );
	}

	public function test_rejects_invalid_data_type() {
		$this->setExpectedIncorrectUsage( 'WP_Connector_Field_Registry::register' );

		$result = register_connector_field(
			'openai',
			'foo',
			array(
				'type'  => 'slider',
				'label' => 'X',
			)
		);

		$this->assertNull( $result );
	}

	public function test_rejects_invalid_control() {
		$this->setExpectedIncorrectUsage( 'WP_Connector_Field_Registry::register' );

		$result = register_connector_field(
			'openai',
			'foo',
			array(
				'control' => 'slider',
				'label'   => 'X',
			)
		);

		$this->assertNull( $result );
	}

	public function test_rejects_missing_label() {
		$this->setExpectedIncorrectUsage( 'WP_Connector_Field_Registry::register' );

		$result = register_connector_field(
			'openai',
			'foo',
			array( 'control' => 'url' )
		);

		$this->assertNull( $result );
	}

	public function test_rejects_select_without_choices() {
		$this->setExpectedIncorrectUsage( 'WP_Connector_Field_Registry::register' );

		$result = register_connector_field(
			'openai',
			'preferred_model',
			array(
				'control' => 'select',
				'label'   => 'Model',
			)
		);

		$this->assertNull( $result );
	}

	public function test_rejects_select_with_invalid_choice_label() {
		$this->setExpectedIncorrectUsage( 'WP_Connector_Field_Registry::register' );

		$result = register_connector_field(
			'openai',
			'preferred_model',
			array(
				'control' => 'select',
				'label'   => 'Model',
				'choices' => array( 'gpt-4' => '' ),
			)
		);

		$this->assertNull( $result );
	}

	public function test_rejects_non_callable_sanitizer() {
		$this->setExpectedIncorrectUsage( 'WP_Connector_Field_Registry::register' );

		$result = register_connector_field(
			'openai',
			'base_url',
			array(
				'control'           => 'url',
				'label'             => 'URL',
				'sanitize_callback' => 'this_function_definitely_does_not_exist_xyz',
			)
		);

		$this->assertNull( $result );
	}

	public function test_rejects_non_callable_auth_callback() {
		$this->setExpectedIncorrectUsage( 'WP_Connector_Field_Registry::register' );

		$result = register_connector_field(
			'openai',
			'base_url',
			array(
				'control'       => 'url',
				'label'         => 'URL',
				'auth_callback' => 'this_function_definitely_does_not_exist_xyz',
			)
		);

		$this->assertNull( $result );
	}

	public function test_rejects_invalid_show_in_rest() {
		$this->setExpectedIncorrectUsage( 'WP_Connector_Field_Registry::register' );

		$result = register_connector_field(
			'openai',
			'base_url',
			array(
				'control'      => 'url',
				'label'        => 'URL',
				'show_in_rest' => 'yes',
			)
		);

		$this->assertNull( $result );
	}

	public function test_rejects_duplicate_registration() {
		$this->track(
			'openai',
			'base_url',
			array(
				'control' => 'url',
				'label'   => 'URL',
			)
		);

		$this->setExpectedIncorrectUsage( 'WP_Connector_Field_Registry::register' );

		$result = register_connector_field(
			'openai',
			'base_url',
			array(
				'control' => 'url',
				'label'   => 'URL',
			)
		);

		$this->assertNull( $result );
	}

	/* ---------------------------------------------------------------------
	 * Read helpers
	 * ------------------------------------------------------------------- */

	public function test_wp_get_connector_field_returns_null_for_unknown() {
		$this->assertNull( wp_get_connector_field( 'openai', 'missing' ) );
	}

	public function test_wp_get_connector_fields_returns_empty_for_connector_with_none() {
		$this->assertSame( array(), wp_get_connector_fields( 'openai' ) );
	}

	public function test_wp_get_connector_fields_indexes_by_name() {
		$this->track(
			'openai',
			'base_url',
			array(
				'control' => 'url',
				'label'   => 'URL',
			)
		);
		$this->track(
			'openai',
			'organisation_id',
			array(
				'control' => 'text',
				'label'   => 'Org',
			)
		);

		$fields = wp_get_connector_fields( 'openai' );

		$this->assertSame( array( 'base_url', 'organisation_id' ), array_keys( $fields ) );
	}

	/* ---------------------------------------------------------------------
	 * unregister_connector_field
	 * ------------------------------------------------------------------- */

	public function test_unregister_returns_the_removed_field() {
		register_connector_field(
			'openai',
			'base_url',
			array(
				'control' => 'url',
				'label'   => 'URL',
			)
		);

		$removed = unregister_connector_field( 'openai', 'base_url' );

		$this->assertIsArray( $removed );
		$this->assertSame( 'base_url', $removed['name'] );
		$this->assertNull( wp_get_connector_field( 'openai', 'base_url' ) );
	}

	public function test_unregister_missing_field_triggers_doing_it_wrong() {
		$this->setExpectedIncorrectUsage( 'WP_Connector_Field_Registry::unregister' );

		$this->assertNull( unregister_connector_field( 'openai', 'never_registered' ) );
	}

	/* ---------------------------------------------------------------------
	 * wp_get_connector_field_value — resolution order
	 * ------------------------------------------------------------------- */

	public function test_value_resolution_returns_default_when_nothing_set() {
		$this->track(
			'openai',
			'base_url',
			array(
				'control' => 'url',
				'label'   => 'URL',
				'default' => 'https://default.test/v1',
			)
		);

		$this->assertSame(
			'https://default.test/v1',
			wp_get_connector_field_value( 'openai', 'base_url' )
		);
	}

	public function test_value_resolution_returns_option_value() {
		$this->track(
			'openai',
			'base_url',
			array(
				'control' => 'url',
				'label'   => 'URL',
				'default' => 'https://default.test/v1',
			)
		);

		update_option( 'connectors_ai_openai_base_url', 'https://stored.test/v1' );

		$this->assertSame(
			'https://stored.test/v1',
			wp_get_connector_field_value( 'openai', 'base_url' )
		);

		delete_option( 'connectors_ai_openai_base_url' );
	}

	public function test_value_resolution_env_beats_option() {
		$this->track(
			'openai',
			'base_url',
			array(
				'control'      => 'url',
				'label'        => 'URL',
				'default'      => 'https://default.test/v1',
				'env_var_name' => 'WP_TEST_OPENAI_BASE_URL',
			)
		);

		update_option( 'connectors_ai_openai_base_url', 'https://db.test/v1' );
		putenv( 'WP_TEST_OPENAI_BASE_URL=https://env.test/v1' );

		$this->assertSame(
			'https://env.test/v1',
			wp_get_connector_field_value( 'openai', 'base_url' )
		);

		putenv( 'WP_TEST_OPENAI_BASE_URL' );
		delete_option( 'connectors_ai_openai_base_url' );
	}

	public function test_value_resolution_returns_null_for_unknown_field() {
		$this->assertNull(
			wp_get_connector_field_value( 'openai', 'never_registered' )
		);
	}

	/* ---------------------------------------------------------------------
	 * Back-compat synthesis of the legacy api_key field
	 * ------------------------------------------------------------------- */

	public function test_synth_creates_api_key_field_for_api_key_connectors() {
		// The synth hook runs during `wp_connectors_init`. Fire it manually
		// against a fresh field registry to exercise the shim.
		WP_Connector_Field_Registry::set_instance( null );
		_gutenberg_connector_fields_synthesize_legacy( WP_Connector_Registry::get_instance() );

		$field = wp_get_connector_field( 'openai', 'api_key' );

		$this->assertIsArray( $field );
		$this->assertTrue( $field['sensitive'] );
		// The legacy API key is a string stored value rendered as a password.
		$this->assertSame( 'string', $field['type'] );
		$this->assertSame( 'password', $field['control'] );
		$this->assertSame( 'connectors_ai_openai_api_key', $field['setting_name'] );
	}

	public function test_synth_is_idempotent_when_api_key_already_registered() {
		$this->track(
			'openai',
			'api_key',
			array(
				'control' => 'password',
				'label'   => 'Custom API Key label',
			)
		);

		_gutenberg_connector_fields_synthesize_legacy( WP_Connector_Registry::get_instance() );

		// Plugin's explicit registration must win.
		$field = wp_get_connector_field( 'openai', 'api_key' );
		$this->assertSame( 'Custom API Key label', $field['label'] );
	}

	/* ---------------------------------------------------------------------
	 * Mask + source helpers
	 * ------------------------------------------------------------------- */

	public function test_mask_returns_input_when_4_chars_or_shorter() {
		$this->assertSame( '', _gutenberg_connector_fields_mask( '' ) );
		$this->assertSame( 'ab', _gutenberg_connector_fields_mask( 'ab' ) );
		$this->assertSame( 'abcd', _gutenberg_connector_fields_mask( 'abcd' ) );
	}

	public function test_mask_hides_all_but_last_four() {
		$masked = _gutenberg_connector_fields_mask( 'sk-live-0123456789fj39' );

		$this->assertStringEndsWith( 'fj39', $masked );
		$this->assertMatchesRegularExpression( '/^\x{2022}+fj39$/u', $masked );
	}

	public function test_mask_caps_bullet_prefix_at_16() {
		$long = str_repeat( 'x', 100 ) . 'WXYZ';

		$masked = _gutenberg_connector_fields_mask( $long );

		// 16 bullets + 4 visible = 20 characters total.
		$this->assertSame( 20, mb_strlen( $masked ) );
		$this->assertStringEndsWith( 'WXYZ', $masked );
	}

	public function test_resolve_source_prefers_env_over_constant_over_db() {
		update_option( 'test_connector_source_value', 'from-db' );

		$this->assertSame(
			'database',
			_gutenberg_connector_fields_resolve_source( 'test_connector_source_value' )
		);

		putenv( 'WP_TEST_RESOLVE_SRC=from-env' );
		$this->assertSame(
			'env',
			_gutenberg_connector_fields_resolve_source(
				'test_connector_source_value',
				'WP_TEST_RESOLVE_SRC'
			)
		);
		putenv( 'WP_TEST_RESOLVE_SRC' );

		delete_option( 'test_connector_source_value' );
		$this->assertSame(
			'none',
			_gutenberg_connector_fields_resolve_source( 'test_connector_source_value' )
		);
	}
	/**
	 * A stored falsy-but-set value (0) must be returned rather than falling
	 * through to the registered default. Regression guard for the value
	 * resolver's strict comparisons.
	 */
	public function test_value_resolution_preserves_stored_zero() {
		$this->track(
			'openai',
			'max_tokens',
			array(
				'type'    => 'integer',
				'control' => 'number',
				'label'   => 'Max tokens',
				'default' => 256,
			)
		);

		update_option( 'connectors_ai_openai_max_tokens', 0 );

		$this->assertEquals( 0, wp_get_connector_field_value( 'openai', 'max_tokens' ) );
		$this->assertNotEquals( 256, wp_get_connector_field_value( 'openai', 'max_tokens' ) );

		delete_option( 'connectors_ai_openai_max_tokens' );
	}

	/* ---------------------------------------------------------------------
	 * REST dispatch — sensitive masking
	 * ------------------------------------------------------------------- */

	/**
	 * Sensitive field values must be masked in the /wp/v2/settings response.
	 */
	public function test_rest_dispatch_masks_sensitive_field() {
		// Synthesize the legacy api_key field for the AI providers.
		WP_Connector_Field_Registry::set_instance( null );
		_gutenberg_connector_fields_synthesize_legacy( WP_Connector_Registry::get_instance() );

		$setting_name = 'connectors_ai_openai_api_key';
		$raw          = 'sk-secret-0123456789abcd';

		$request  = new WP_REST_Request( 'GET', '/wp/v2/settings' );
		$response = new WP_REST_Response( array( $setting_name => $raw ) );
		$server   = rest_get_server();

		$result = _gutenberg_connector_fields_rest_dispatch( $response, $server, $request );
		$data   = $result->get_data();

		$this->assertArrayHasKey( $setting_name, $data );
		$this->assertNotSame( $raw, $data[ $setting_name ], 'raw key must not be exposed' );
		$this->assertStringEndsWith( 'abcd', $data[ $setting_name ] );
	}

	/**
	 * A non-settings route must pass through untouched.
	 */
	public function test_rest_dispatch_ignores_other_routes() {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/posts' );
		$response = new WP_REST_Response( array( 'connectors_ai_openai_api_key' => 'sk-secret-0123456789abcd' ) );

		$result = _gutenberg_connector_fields_rest_dispatch( $response, rest_get_server(), $request );

		$this->assertSame(
			array( 'connectors_ai_openai_api_key' => 'sk-secret-0123456789abcd' ),
			$result->get_data()
		);
	}

	/**
	 * An update (POST) must not fatal and must still mask a non-AI sensitive
	 * field. Exercises the $is_update branch without entering the AI-provider
	 * live-validation path.
	 */
	public function test_rest_dispatch_masks_on_update_for_non_ai_field() {
		$this->track_connector(
			'vault-bridge',
			array(
				'name'           => 'Vault Bridge',
				'type'           => 'secret_store',
				'authentication' => array( 'method' => 'none' ),
			)
		);
		$this->track(
			'vault-bridge',
			'token',
			array(
				'control'   => 'password',
				'label'     => 'Token',
				'sensitive' => true,
			)
		);

		$setting_name = 'connectors_secret_store_vault_bridge_token';
		$request      = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$response     = new WP_REST_Response( array( $setting_name => 'tok-secret-0123456789wxyz' ) );

		$result = _gutenberg_connector_fields_rest_dispatch( $response, rest_get_server(), $request );
		$data   = $result->get_data();

		$this->assertStringEndsWith( 'wxyz', $data[ $setting_name ] );
		$this->assertNotSame( 'tok-secret-0123456789wxyz', $data[ $setting_name ] );
	}

	/**
	 * A field guarded by a failing auth_callback must be removed from the REST
	 * response rather than exposed (even masked).
	 */
	public function test_rest_dispatch_removes_field_failing_auth() {
		$this->track_connector(
			'vault-bridge',
			array(
				'name'           => 'Vault Bridge',
				'type'           => 'secret_store',
				'authentication' => array( 'method' => 'none' ),
			)
		);
		$this->track(
			'vault-bridge',
			'token',
			array(
				'control'       => 'password',
				'label'         => 'Token',
				'sensitive'     => true,
				'auth_callback' => '__return_false',
			)
		);

		$setting_name = 'connectors_secret_store_vault_bridge_token';
		$request      = new WP_REST_Request( 'GET', '/wp/v2/settings' );
		$response     = new WP_REST_Response( array( $setting_name => 'tok-secret-0123456789wxyz' ) );

		$result = _gutenberg_connector_fields_rest_dispatch( $response, rest_get_server(), $request );

		$this->assertArrayNotHasKey( $setting_name, $result->get_data() );
	}

	/* ---------------------------------------------------------------------
	 * Per-type defaults
	 * ------------------------------------------------------------------- */

	public function test_default_is_type_appropriate_when_omitted() {
		$bool = $this->track(
			'openai',
			'enabled',
			array(
				'type'  => 'boolean',
				'label' => 'Enabled',
			)
		);
		$this->assertFalse( $bool['default'] );

		$int = $this->track(
			'openai',
			'max_tokens',
			array(
				'type'  => 'integer',
				'label' => 'Max tokens',
			)
		);
		$this->assertSame( 0, $int['default'] );

		$str = $this->track(
			'openai',
			'base_url',
			array(
				'control' => 'url',
				'label'   => 'URL',
			)
		);
		$this->assertSame( '', $str['default'] );
	}
}
