<?php
/**
 * Tests for the rules a suggestion's `attribute-set` operations are held to
 * when its note is written. They mirror the editor's accept-time check
 * (`operations/validate.ts`), whose test cases these follow.
 *
 * @group suggestions
 */
class Tests_Suggestion_Attribute_Operations extends WP_Test_REST_TestCase {

	private const GROUP  = 'core/test-validate-group';
	private const BUTTON = 'core/test-validate-button';

	/**
	 * @var int
	 */
	private static int $contributor_id;

	/**
	 * @var int
	 */
	private static int $editor_id;

	/**
	 * @var int
	 */
	private static int $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ): void {
		$contributor_id = $factory->user->create( array( 'role' => 'contributor' ) );
		$editor_id      = $factory->user->create( array( 'role' => 'editor' ) );
		$post_id        = $factory->post->create(
			array(
				'post_author' => $contributor_id,
				'post_status' => 'draft',
			)
		);
		self::assertIsInt( $contributor_id );
		self::assertIsInt( $editor_id );
		self::assertIsInt( $post_id );
		self::$contributor_id = $contributor_id;
		self::$editor_id      = $editor_id;
		self::$post_id        = $post_id;
	}

	public function set_up(): void {
		parent::set_up();
		add_filter(
			'pre_option_gutenberg-experiments',
			static function (): array {
				return array( 'gutenberg-suggestion-mode' => true );
			}
		);
		wp_create_initial_comment_meta();
		gutenberg_register_suggestion_meta();
		register_block_type(
			self::GROUP,
			array(
				'attributes' => array(
					'tagName' => array(
						'type'    => 'string',
						'default' => 'div',
					),
					'columns' => array( 'type' => 'integer' ),
					'ratio'   => array( 'type' => 'number' ),
					'wide'    => array( 'type' => 'boolean' ),
					'images'  => array( 'type' => 'array' ),
				),
				'supports'   => array(
					'anchor' => true,
					'color'  => array( 'background' => true ),
				),
			)
		);
		register_block_type(
			self::BUTTON,
			array(
				'attributes' => array(
					'tagName' => array(
						'type'    => 'string',
						'enum'    => array( 'a', 'button' ),
						'default' => 'a',
					),
					'url'     => array(
						'type'      => 'string',
						'source'    => 'attribute',
						'selector'  => 'a',
						'attribute' => 'href',
					),
					'target'  => array(
						'type'      => 'string',
						'source'    => 'attribute',
						'selector'  => 'a',
						'attribute' => 'href',
					),
					'text'    => array(
						'type'   => 'rich-text',
						'source' => 'rich-text',
					),
				),
			)
		);
		wp_set_current_user( self::$contributor_id );
	}

	public function tear_down(): void {
		unregister_block_type( self::GROUP );
		unregister_block_type( self::BUTTON );
		parent::tear_down();
	}

	/**
	 * A payload of `attribute-set` operations for a block.
	 *
	 * @param string               $block_name Block name.
	 * @param array<string, mixed> $after      Proposed values by attribute.
	 * @param array<string, mixed> $before     Baseline values by attribute.
	 * @return string The payload JSON.
	 */
	private function payload( string $block_name, array $after, array $before = array() ): string {
		$operations = array();
		foreach ( $after as $attribute => $value ) {
			$operations[] = array(
				'type'      => 'attribute-set',
				'attribute' => $attribute,
				'before'    => $before[ $attribute ] ?? null,
				'after'     => $value,
			);
		}
		return (string) wp_json_encode(
			array(
				'schemaVersion' => 2,
				'blockName'     => $block_name,
				'baseRevision'  => null,
				'operations'    => $operations,
			)
		);
	}

	/**
	 * The problem with a block's proposed attribute values.
	 *
	 * @param string               $block_name Block name.
	 * @param array<string, mixed> $after      Proposed values by attribute.
	 * @param array<string, mixed> $before     Baseline values by attribute.
	 * @return string|null The problem, or null.
	 */
	private function problem( string $block_name, array $after, array $before = array() ): ?string {
		return gutenberg_find_suggestion_attribute_operation_problem( $this->payload( $block_name, $after, $before ) );
	}

	/**
	 * @return positive-int Note ID.
	 */
	private function create_note(): int {
		$note_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => self::$post_id,
				'comment_type'     => 'note',
				'comment_approved' => '0',
				'user_id'          => self::$contributor_id,
			)
		);
		if ( ! is_int( $note_id ) || $note_id < 1 ) {
			self::fail( 'The note was not created.' );
		}
		return $note_id;
	}

	/**
	 * Sends a `_wp_suggestion` over REST, creating a note or updating one.
	 *
	 * @param string   $payload The payload JSON.
	 * @param int|null $note_id Note to update, or null to create one.
	 * @return WP_REST_Response The response.
	 */
	private function send( string $payload, ?int $note_id = null ): WP_REST_Response {
		$request = new WP_REST_Request( $note_id ? 'PUT' : 'POST', '/wp/v2/comments' . ( $note_id ? '/' . $note_id : '' ) );
		$request->add_header( 'Content-Type', 'application/json' );
		$params = array( 'meta' => array( '_wp_suggestion' => $payload ) );
		if ( ! $note_id ) {
			$params += array(
				'post'    => self::$post_id,
				'content' => '',
				'type'    => 'note',
				'status'  => 'hold',
			);
		}
		$request->set_body( (string) wp_json_encode( $params ) );
		return rest_get_server()->dispatch( $request );
	}

	public function test_accepts_declared_attributes(): void {
		$this->assertNull(
			$this->problem(
				self::GROUP,
				array(
					'tagName' => 'section',
					'columns' => 3,
					'ratio'   => 1.5,
					'wide'    => true,
					'images'  => array( array( 'id' => 1 ) ),
				)
			)
		);
	}

	/**
	 * Block supports add their attributes to the types registered before
	 * `init` ends, so a core block stands in for the test ones here.
	 */
	public function test_accepts_the_attributes_block_supports_add(): void {
		$group = WP_Block_Type_Registry::get_instance()->get_registered( 'core/group' );
		$this->assertInstanceOf( WP_Block_Type::class, $group );
		foreach ( array( 'style', 'className', 'anchor', 'layout', 'backgroundColor', 'fontSize', 'lock', 'metadata' ) as $attribute ) {
			$this->assertArrayHasKey( $attribute, $group->get_attributes() );
		}

		$this->assertNull(
			$this->problem(
				'core/group',
				array(
					'anchor'          => 'intro',
					'className'       => 'is-style-wide',
					'backgroundColor' => 'primary',
					'fontSize'        => 'large',
					'style'           => array( 'color' => array( 'background' => '#fff' ) ),
					'layout'          => array( 'type' => 'constrained' ),
					'lock'            => array( 'move' => true ),
					'metadata'        => array( 'name' => 'Hero' ),
				)
			)
		);
		$this->assertSame( 'invalid-value', $this->problem( 'core/group', array( 'className' => array( 'is-style-wide' ) ) ) );
		$this->assertSame( 'invalid-value', $this->problem( 'core/group', array( 'lock' => 'all' ) ) );
	}

	public function test_accepts_an_unset_value(): void {
		$this->assertNull( $this->problem( self::GROUP, array( 'tagName' => null ) ) );
		$this->assertNull( gutenberg_find_suggestion_attribute_operation_problem( '{"blockName":"' . self::GROUP . '","operations":[{"type":"attribute-set","attribute":"columns"}]}' ) );
	}

	public function test_ignores_operations_that_set_no_attribute(): void {
		$this->assertNull(
			gutenberg_find_suggestion_attribute_operation_problem(
				'{"blockName":"' . self::BUTTON . '","operations":[{"type":"block-remove"},{"type":"inline-suggestion","attribute":"url","after":"javascript:x"},{"type":"post-attribute-set","attribute":"title","after":"javascript:x"}]}'
			)
		);
	}

	public function test_refuses_an_operation_that_names_no_attribute(): void {
		$this->assertSame(
			'unknown-attribute',
			gutenberg_find_suggestion_attribute_operation_problem( '{"blockName":"' . self::GROUP . '","operations":[{"type":"attribute-set","attribute":7,"after":"x"}]}' )
		);
	}

	/**
	 * The editor can know block types and attributes the server does not: a
	 * block registered only in JavaScript, an attribute a plugin adds with a
	 * `blocks.registerBlockType` filter. They have no schema here, so they
	 * are stored and the editor checks them on accept.
	 */
	public function test_stores_what_only_the_editor_can_know(): void {
		$this->assertNull( $this->problem( 'plugin/client-only', array( 'tagName' => 'x-widget' ) ) );
		$this->assertNull( $this->problem( self::GROUP, array( 'addedByAPlugin' => array( 'speed' => 2 ) ) ) );
	}

	/**
	 * The rules that do not read the block type hold for any block.
	 *
	 * @dataProvider data_values_refused_for_any_block
	 *
	 * @param array<string, mixed> $after    Proposed values by attribute.
	 * @param string               $expected Expected problem.
	 */
	public function test_refuses_values_no_block_type_can_allow( array $after, string $expected ): void {
		$this->assertSame( $expected, $this->problem( 'plugin/client-only', $after ) );
		$this->assertSame( $expected, gutenberg_find_suggestion_attribute_operation_problem( str_replace( '"blockName":"plugin/client-only",', '', $this->payload( 'plugin/client-only', $after ) ) ) );
	}

	/**
	 * @return array<string, array{0: array<string, mixed>, 1: string}>
	 */
	public function data_values_refused_for_any_block(): array {
		return array(
			'a script URL'            => array( array( 'url' => 'javascript:alert(1)' ), 'unsafe-value' ),
			'a script URL, by suffix' => array( array( 'mediaLink' => 'javascript:alert(1)' ), 'unsafe-value' ),
			'a nested script URL'     => array( array( 'items' => array( array( 'href' => 'javascript:alert(1)' ) ) ), 'unsafe-value' ),
			'a style breakout'        => array( array( 'style' => array( 'color' => array( 'text' => 'red;position:fixed' ) ) ), 'unsafe-value' ),
			'custom CSS'              => array( array( 'style' => array( 'css' => 'color: red;' ) ), 'unsafe-value' ),
			'a note linkage'          => array( array( 'metadata' => array( 'noteId' => array( 9 ) ) ), 'invalid-value' ),
		);
	}

	/**
	 * @dataProvider data_values_of_the_wrong_type
	 *
	 * @param string $attribute Attribute name.
	 * @param string $after     Proposed value, as JSON.
	 */
	public function test_refuses_a_value_of_the_wrong_type( string $attribute, string $after ): void {
		$this->assertSame(
			'invalid-value',
			gutenberg_find_suggestion_attribute_operation_problem( '{"blockName":"' . self::GROUP . '","operations":[{"type":"attribute-set","attribute":"' . $attribute . '","after":' . $after . '}]}' )
		);
	}

	/**
	 * @return array<string, array{0: string, 1: string}>
	 */
	public function data_values_of_the_wrong_type(): array {
		return array(
			'a numeric string as an integer' => array( 'columns', '"3"' ),
			'a fraction as an integer'       => array( 'columns', '2.5' ),
			'a numeric string as a number'   => array( 'ratio', '"1.5"' ),
			'a string as a boolean'          => array( 'wide', '"yes"' ),
			'an integer as a boolean'        => array( 'wide', '1' ),
			'an object as a string'          => array( 'tagName', '{"toString":"script"}' ),
			'an object as an array'          => array( 'images', '{"0":"x"}' ),
			'a comma list as an array'       => array( 'images', '"a,b"' ),
		);
	}

	/**
	 * JSON has one number type, and PHP encodes an empty object as a list.
	 */
	public function test_reads_json_values_as_the_editor_does(): void {
		foreach ( array(
			'columns' => '3.0',
			'style'   => '{}',
			'lock'    => '[]',
			'images'  => '[]',
		) as $attribute => $after ) {
			$this->assertNull(
				gutenberg_find_suggestion_attribute_operation_problem( '{"blockName":"core/gallery","operations":[{"type":"attribute-set","attribute":"' . $attribute . '","after":' . $after . '}]}' ),
				"$attribute set to $after"
			);
		}
		foreach ( array( '"color:red"', '["color:red"]' ) as $after ) {
			$this->assertSame(
				'invalid-value',
				gutenberg_find_suggestion_attribute_operation_problem( '{"blockName":"core/gallery","operations":[{"type":"attribute-set","attribute":"style","after":' . $after . '}]}' ),
				"style set to $after"
			);
		}
	}

	public function test_honours_a_declared_enum(): void {
		$this->assertNull( $this->problem( self::BUTTON, array( 'tagName' => 'button' ) ) );
		$this->assertSame( 'invalid-value', $this->problem( self::BUTTON, array( 'tagName' => 'script' ) ) );
	}

	/**
	 * @dataProvider data_unsafe_tag_names
	 *
	 * @param string $tag_name Proposed tag name.
	 */
	public function test_refuses_a_tag_name_where_no_enum_is_declared( string $tag_name ): void {
		$this->assertSame( 'unsafe-value', $this->problem( self::GROUP, array( 'tagName' => $tag_name ) ) );
	}

	/**
	 * @return array<int, array{0: string}>
	 */
	public function data_unsafe_tag_names(): array {
		return array( array( 'script' ), array( 'SCRIPT' ), array( 'iframe' ), array( 'style' ), array( 'x-widget' ), array( 'div onload' ), array( "div\n" ) );
	}

	public function test_accepts_the_default_and_the_sectioning_tag_names(): void {
		$this->assertNull( $this->problem( self::GROUP, array( 'tagName' => '' ) ) );
		$this->assertNull( $this->problem( self::GROUP, array( 'tagName' => 'aside' ) ) );
	}

	/**
	 * @dataProvider data_unsafe_urls
	 *
	 * @param string $url Proposed URL.
	 */
	public function test_refuses_a_url_with_a_disallowed_protocol( string $url ): void {
		$this->assertSame( 'unsafe-value', $this->problem( self::BUTTON, array( 'url' => $url ) ) );
		// Named for something else, but read from `href`.
		$this->assertSame( 'unsafe-value', $this->problem( self::BUTTON, array( 'target' => $url ) ) );
	}

	/**
	 * @return array<int, array{0: string}>
	 */
	public function data_unsafe_urls(): array {
		return array(
			array( 'javascript:alert(1)' ),
			array( " JaVa\tScript:alert(1)" ),
			array( "java\nscript:alert(1)" ),
			array( "\x01javascript:alert(1)" ),
			array( 'data:text/html,<script>alert(1)</script>' ),
			array( 'vbscript:x' ),
		);
	}

	public function test_refuses_a_disallowed_url_nested_in_a_structured_value(): void {
		$this->assertSame(
			'unsafe-value',
			$this->problem(
				self::GROUP,
				array(
					'images' => array(
						array(
							'id'      => 1,
							'fullUrl' => 'javascript:alert(1)',
						),
					),
				)
			)
		);
		$this->assertSame(
			'unsafe-value',
			$this->problem( self::GROUP, array( 'style' => array( 'background' => array( 'backgroundImage' => array( 'url' => 'javascript:alert(1)' ) ) ) ) )
		);
	}

	/**
	 * A relative URL may hold a colon, which `wp_kses_bad_protocol()` would
	 * read as a protocol.
	 */
	public function test_accepts_allowed_relative_and_fragment_urls(): void {
		foreach ( array( 'https://example.org/a?b=c', 'mailto:someone@example.org', 'TEL:+123', '/about', '#top', 'page.html?a=b:c', '/wiki/Help:Contents', '' ) as $url ) {
			$this->assertNull( $this->problem( self::BUTTON, array( 'url' => $url ) ), $url );
		}
	}

	public function test_follows_the_allowed_protocols_of_the_site(): void {
		$this->assertSame( 'unsafe-value', $this->problem( self::BUTTON, array( 'url' => 'web+app://open' ) ) );
	}

	public function test_does_not_read_text_as_a_url(): void {
		$this->assertNull( $this->problem( self::BUTTON, array( 'text' => 'Note: read this first' ) ) );
	}

	/**
	 * @dataProvider data_style_breakouts
	 *
	 * @param array<string, mixed> $style Proposed style.
	 */
	public function test_refuses_a_style_value_that_leaves_its_declaration( array $style ): void {
		$this->assertSame( 'unsafe-value', $this->problem( self::GROUP, array( 'style' => $style ) ) );
	}

	/**
	 * @return array<string, array{0: array<string, mixed>}>
	 */
	public function data_style_breakouts(): array {
		return array(
			'a second declaration' => array( array( 'color' => array( 'background' => 'red;position:fixed;inset:0' ) ) ),
			'a resource load'      => array( array( 'color' => array( 'background' => 'url(https://example.org/track)' ) ) ),
			'a spaced url()'       => array( array( 'color' => array( 'background' => "URL\u{00a0}(x)" ) ) ),
			'a rule'               => array( array( 'spacing' => array( 'padding' => array( 'top' => '1px} body{display:none' ) ) ) ),
			'a comment'            => array( array( 'typography' => array( 'fontSize' => '1rem/* x */' ) ) ),
			'an escape'            => array( array( 'typography' => array( 'fontFamily' => 'a\\3b b' ) ) ),
			'an import'            => array( array( 'typography' => array( 'fontFamily' => '@import x' ) ) ),
		);
	}

	public function test_accepts_ordinary_style_values(): void {
		$this->assertNull(
			$this->problem(
				self::GROUP,
				array(
					'style' => array(
						'color'      => array(
							'background' => 'var:preset|color|primary',
							'gradient'   => 'linear-gradient(135deg,rgb(6,147,227) 0%,rgb(155,81,224) 100%)',
						),
						'spacing'    => array( 'padding' => array( 'top' => 'clamp(1rem, 2vw, 3rem)' ) ),
						'dimensions' => array( 'aspectRatio' => '16/9' ),
						'typography' => array( 'fontFamily' => 'Smith & Sons, serif' ),
						'background' => array( 'backgroundImage' => array( 'url' => 'https://example.org/a.png' ) ),
					),
				)
			)
		);
	}

	public function test_refuses_custom_css_from_a_suggester_without_edit_css(): void {
		$this->assertFalse( current_user_can( 'edit_css' ) );
		$style = array(
			'css'   => 'color: red;',
			'color' => array( 'text' => '#000' ),
		);
		$this->assertSame( 'unsafe-value', $this->problem( self::GROUP, array( 'style' => $style ) ) );
		$this->assertSame(
			'unsafe-value',
			$this->problem( self::GROUP, array( 'style' => array( ':hover' => array( 'css' => 'color: red;' ) ) ), array( 'style' => array( 'css' => 'color: red;' ) ) )
		);
		$this->assertSame(
			'unsafe-value',
			$this->problem( self::GROUP, array( 'style' => $style ), array( 'style' => array( 'css' => 'color: blue;' ) ) )
		);
		// Carried along unchanged with another style edit.
		$this->assertNull( $this->problem( self::GROUP, array( 'style' => $style ), array( 'style' => array( 'css' => 'color: red;' ) ) ) );
	}

	public function test_accepts_custom_css_from_a_suggester_with_edit_css(): void {
		wp_set_current_user( self::$editor_id );
		$this->assertTrue( current_user_can( 'edit_css' ) );
		$this->assertNull( $this->problem( self::GROUP, array( 'style' => array( 'css' => '& a { color: red; }' ) ) ) );
		// Only the custom CSS: any other string is still one declaration's value.
		$this->assertSame( 'unsafe-value', $this->problem( self::GROUP, array( 'style' => array( 'color' => array( 'text' => 'red;top:0' ) ) ) ) );
	}

	public function test_refuses_a_metadata_proposal_that_names_a_system_key(): void {
		$this->assertSame(
			'invalid-value',
			$this->problem(
				self::GROUP,
				array(
					'metadata' => array(
						'name'   => 'Hero',
						'noteId' => array( 9 ),
					),
				)
			)
		);
		$this->assertSame( 'invalid-value', $this->problem( self::GROUP, array( 'metadata' => array( 'suggestion' => array( 'type' => 'pending-remove' ) ) ) ) );
	}

	public function test_core_block_proposals_pass(): void {
		$this->assertNull( $this->problem( 'core/heading', array( 'level' => 3 ) ) );
		$this->assertNull( $this->problem( 'core/paragraph', array( 'content' => 'Hello <em>world</em>: see https://example.org' ) ) );
		$this->assertNull( $this->problem( 'core/group', array( 'tagName' => 'main' ) ) );
		$this->assertSame( 'invalid-value', $this->problem( 'core/heading', array( 'level' => '3' ) ) );
		$this->assertSame( 'unsafe-value', $this->problem( 'core/button', array( 'url' => 'javascript:alert(1)' ) ) );
	}

	public function test_rest_create_refuses_an_invalid_operation(): void {
		$before = get_comments(
			array(
				'post_id' => self::$post_id,
				'type'    => 'note',
				'status'  => 'all',
				'count'   => true,
			)
		);

		$this->assertErrorResponse( 'rest_invalid_suggestion', $this->send( $this->payload( self::GROUP, array( 'tagName' => 'script' ) ) ), 400 );
		$this->assertErrorResponse( 'rest_invalid_suggestion', $this->send( $this->payload( self::GROUP, array( 'columns' => '3' ) ) ), 400 );

		$this->assertSame(
			$before,
			get_comments(
				array(
					'post_id' => self::$post_id,
					'type'    => 'note',
					'status'  => 'all',
					'count'   => true,
				)
			)
		);
	}

	public function test_rest_update_refuses_an_invalid_operation(): void {
		$note_id = $this->create_note();
		$valid   = $this->payload( self::BUTTON, array( 'url' => 'https://example.org' ) );
		$this->assertSame( 200, $this->send( $valid, $note_id )->get_status() );
		$stored = get_comment_meta( $note_id, '_wp_suggestion', true );

		$this->assertErrorResponse( 'rest_invalid_suggestion', $this->send( $this->payload( self::BUTTON, array( 'url' => 'javascript:alert(1)' ) ), $note_id ), 400 );
		$this->assertSame( $stored, get_comment_meta( $note_id, '_wp_suggestion', true ) );
	}

	/**
	 * The payload is judged as sent. Filtering it for storage encodes `&`
	 * and `>`, which must not read as a breakout or as changed custom CSS.
	 */
	public function test_rest_stores_a_valid_payload_that_kses_encodes(): void {
		$this->assertFalse( current_user_can( 'unfiltered_html' ) );
		$css      = '& > a { color: red; }';
		$response = $this->send(
			$this->payload(
				self::GROUP,
				array(
					'style' => array(
						'css'        => $css,
						'typography' => array( 'fontFamily' => 'Smith & Sons, serif' ),
					),
				),
				array( 'style' => array( 'css' => $css ) )
			)
		);
		$this->assertSame( 201, $response->get_status() );

		$data = $response->get_data();
		$this->assertIsArray( $data );
		$this->assertIsInt( $data['id'] );
		$stored = get_comment_meta( $data['id'], '_wp_suggestion', true );
		$this->assertIsString( $stored );
		$this->assertStringContainsString( 'Smith &amp; Sons', $stored );
	}

	public function test_meta_update_outside_rest_refuses_an_invalid_operation(): void {
		$note_id = $this->create_note();
		$valid   = $this->payload( self::GROUP, array( 'tagName' => 'section' ) );
		$this->assertNotFalse( update_comment_meta( $note_id, '_wp_suggestion', wp_slash( $valid ) ) );
		$stored = get_comment_meta( $note_id, '_wp_suggestion', true );
		$this->assertNotSame( '', $stored );

		$this->assertFalse( update_comment_meta( $note_id, '_wp_suggestion', wp_slash( $this->payload( self::GROUP, array( 'tagName' => 'script' ) ) ) ) );
		$this->assertSame( $stored, get_comment_meta( $note_id, '_wp_suggestion', true ) );
	}

	public function test_comment_insert_outside_rest_refuses_an_invalid_operation(): void {
		$note_id = wp_insert_comment(
			wp_slash(
				array(
					'comment_post_ID'  => self::$post_id,
					'comment_type'     => 'note',
					'comment_approved' => '0',
					'user_id'          => self::$contributor_id,
					'comment_meta'     => array( '_wp_suggestion' => $this->payload( self::BUTTON, array( 'url' => 'javascript:alert(1)' ) ) ),
				)
			)
		);
		$this->assertIsInt( $note_id );
		$this->assertSame( array(), get_comment_meta( $note_id, '_wp_suggestion' ) );
	}
}
