<?php
/**
 * Tests for server-rendered `@wordpress/ui` components.
 *
 * The markup comes from snapshots of the React components, so these tests
 * check how PHP fills them in: each example the build renders with React must
 * come out the same from PHP, and props must be validated and escaped. They
 * also fail when the React markup changed and the committed snapshots weren't
 * updated, so every React change is reviewed for its PHP impact.
 *
 * @package gutenberg
 *
 * @covers Gutenberg_UI_Components
 */

require_once dirname( __DIR__, 2 ) . '/lib/experimental/ui-components/load.php';

class Gutenberg_UI_Components_Test extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();

		if ( ! gutenberg_ui_components()->is_available() ) {
			$this->markTestSkipped( 'Run `npm run build` to build packages/ui/build-php.' );
		}
	}

	/**
	 * React renders of every component example.
	 *
	 * @return array
	 */
	public function data_examples() {
		$file = dirname( __DIR__, 2 ) . '/packages/ui/build-php/test/examples.json';
		if ( ! is_readable( $file ) ) {
			return array( 'not built' => array( null ) );
		}

		$cases = array();
		foreach ( json_decode( file_get_contents( $file ), true ) as $example ) {
			$cases[ $example['component'] . ': ' . $example['name'] ] = array( $example );
		}
		return $cases;
	}

	/**
	 * @dataProvider data_examples
	 *
	 * @param array|null $example Example props with the React render.
	 */
	public function test_renders_the_same_markup_as_react( $example ) {
		$html = (string) gutenberg_ui_components_render_example( $example );

		$this->assertSame(
			self::normalize_html( $example['html'] ),
			self::normalize_html( $html ),
			"React:\n{$example['html']}\nPHP:\n{$html}"
		);
	}

	/**
	 * React renders of every combination of variants, with real values.
	 *
	 * @return array
	 */
	public function data_combinations() {
		$file = dirname( __DIR__, 2 ) . '/packages/ui/build-php/test/combinations.json';
		if ( ! is_readable( $file ) ) {
			return array( 'not built' => array( null ) );
		}

		$cases = array();
		foreach ( json_decode( file_get_contents( $file ), true ) as $combination ) {
			$name = array();
			foreach ( $combination['props'] as $prop => $value ) {
				$name[] = $prop . '=' . ( is_bool( $value ) ? var_export( $value, true ) : $value );
			}
			$cases[ $combination['component'] . ': ' . implode( ', ', $name ) ] = array( $combination );
		}
		return $cases;
	}

	/**
	 * PHP builds most combinations from a base render plus what each variant
	 * changes, so every one of them must still match React exactly.
	 *
	 * @dataProvider data_combinations
	 *
	 * @param array|null $combination Props with the React render.
	 */
	public function test_rebuilds_every_combination_like_react( $combination ) {
		$html = (string) gutenberg_ui_components_render_example( $combination );

		$this->assertSame(
			self::normalize_html( $combination['html'] ),
			self::normalize_html( $html ),
			"React:\n{$combination['html']}\nPHP:\n{$html}"
		);
	}

	/**
	 * Components with a committed snapshot.
	 *
	 * @return array
	 */
	public function data_components() {
		$cases = array();
		foreach ( glob( dirname( __DIR__, 2 ) . '/packages/ui/php/*/component.json' ) as $file ) {
			$cases[ basename( dirname( $file ) ) ] = array( dirname( $file ) );
		}
		return $cases;
	}

	/**
	 * @dataProvider data_components
	 *
	 * @param string $dir Component directory.
	 */
	public function test_snapshot_is_up_to_date_with_react( $dir ) {
		$name = json_decode( file_get_contents( $dir . '/component.json' ), true )['name'];

		$this->assertSame(
			file_get_contents( dirname( __DIR__, 2 ) . "/packages/ui/build-php/test/snapshots/{$name}.html" ),
			file_get_contents( $dir . '/snapshot.html' ),
			"The React markup of {$name} changed. Check it on Tools → UI Components, then run `npm run update-php-snapshots --workspace @wordpress/ui` and commit the snapshot."
		);
	}

	public function test_a_bundled_copy_uses_its_own_asset_handles() {
		$bundled = new Gutenberg_UI_Components(
			dirname( __DIR__, 2 ) . '/packages/ui/build-php',
			'https://example.org/my-plugin/ui/',
			'my-plugin-ui-'
		);

		$bundled->render( 'button', array( 'label' => 'Save' ) );

		$this->assertTrue( wp_style_is( 'my-plugin-ui-components', 'enqueued' ) );
		$this->assertStringStartsWith( 'https://example.org/my-plugin/ui/', wp_styles()->registered['my-plugin-ui-components']->src );
	}

	/**
	 * @dataProvider data_loose_booleans
	 *
	 * @param mixed $value A value `rest_validate_value_from_schema()` accepts as a boolean.
	 */
	public function test_accepts_the_values_wordpress_treats_as_booleans( $value ) {
		$this->assertSame(
			(string) gutenberg_get_ui_component(
				'button',
				array(
					'label'    => 'Save',
					'disabled' => true,
				)
			),
			(string) gutenberg_get_ui_component(
				'button',
				array(
					'label'    => 'Save',
					'disabled' => $value,
				)
			)
		);
	}

	public function data_loose_booleans() {
		return array(
			'int'    => array( 1 ),
			'string' => array( '1' ),
			'word'   => array( 'true' ),
		);
	}

	public function test_escapes_text_and_attribute_slots() {
		$html = (string) gutenberg_get_ui_component(
			'button',
			array(
				'label' => '<script>alert(1)</script>',
				'class' => '"><script>',
			)
		);

		$this->assertStringNotContainsString( '<script>', $html );
		$this->assertStringContainsString( '&lt;script&gt;alert(1)&lt;/script&gt;', $html );
	}

	/**
	 * Entities in props are plain text, as in React: named, numeric or not,
	 * they show as written instead of being read as entities.
	 */
	public function test_keeps_entities_in_text_and_attribute_slots_literal() {
		$processor = new WP_HTML_Tag_Processor(
			(string) gutenberg_get_ui_component(
				'button',
				array(
					'label' => 'Tom &amp; Jerry &hellip; &#8217; &lt;b&gt;',
					'class' => 'is-&amp;',
				)
			)
		);

		$processor->next_tag( 'button' );
		$this->assertContains( 'is-&amp;', explode( ' ', $processor->get_attribute( 'class' ) ) );

		$processor->next_token();
		$this->assertSame( 'Tom &amp; Jerry &hellip; &#8217; &lt;b&gt;', $processor->get_modifiable_text() );
	}

	/**
	 * String content is plain text too, so it escapes entities the same way
	 * as props.
	 */
	public function test_keeps_entities_in_string_content_literal() {
		$processor = new WP_HTML_Tag_Processor(
			(string) gutenberg_get_ui_component( 'card', array( 'title' => 'Settings' ), 'Tom &amp; Jerry &hellip;' )
		);

		$text = '';
		while ( $processor->next_token() ) {
			if ( '#text' === $processor->get_token_type() ) {
				$text .= $processor->get_modifiable_text();
			}
		}
		$this->assertStringContainsString( 'Tom &amp; Jerry &hellip;', $text );
	}

	/**
	 * An example's content can be another component, like a block example's
	 * `innerBlocks`.
	 */
	public function test_renders_an_example_with_a_component_as_content() {
		$html = (string) gutenberg_ui_components_render_example(
			array(
				'component' => 'card',
				'props'     => array( 'title' => 'Settings' ),
				'content'   => array(
					'component' => 'button',
					'props'     => array( 'label' => 'Save' ),
				),
			)
		);

		$this->assertSame(
			(string) gutenberg_get_ui_component( 'card', array( 'title' => 'Settings' ), gutenberg_get_ui_component( 'button', array( 'label' => 'Save' ) ) ),
			$html
		);
		$this->assertSame( 1, substr_count( $html, '<button' ) );
	}

	public function test_returns_safe_html_that_prints_like_a_string() {
		$button = gutenberg_get_ui_component( 'button', array( 'label' => 'Save' ) );

		$this->assertInstanceOf( Gutenberg_UI_Safe_HTML::class, $button );
		$this->expectOutputString( (string) $button );
		echo $button; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Testing that it prints.
	}

	public function test_escapes_string_content() {
		$html = (string) gutenberg_get_ui_component( 'card', array( 'title' => 'Settings' ), '<script>alert(1)</script><b>bold</b>' );

		$this->assertStringNotContainsString( '<script>', $html );
		$this->assertStringNotContainsString( '<b>', $html );
		$this->assertStringContainsString( '&lt;script&gt;alert(1)&lt;/script&gt;&lt;b&gt;bold&lt;/b&gt;', $html );
	}

	public function test_inserts_a_component_as_html() {
		$html = (string) gutenberg_get_ui_component(
			'card',
			array( 'title' => 'Settings' ),
			gutenberg_get_ui_component( 'button', array( 'label' => '<script>alert(1)</script>' ) )
		);

		$this->assertSame( 1, substr_count( $html, '<button' ), 'The button is markup, not text.' );
		$this->assertStringNotContainsString( '<script>', $html, 'The button still escapes its own props.' );
	}

	public function test_inserts_what_a_closure_prints() {
		$name = '<script>alert(1)</script>';
		$html = (string) gutenberg_get_ui_component(
			'card',
			array( 'title' => 'Settings' ),
			static function () use ( $name ) {
				echo '<p>' . esc_html( $name ) . '</p>';
				echo gutenberg_get_ui_component( 'button', array( 'label' => 'Save' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Component output.
			}
		);

		$this->assertStringContainsString( '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>', $html );
		$this->assertSame( 1, substr_count( $html, '<button' ) );
	}

	public function test_uses_what_a_closure_returns_with_the_same_rules() {
		$with_component = (string) gutenberg_get_ui_component(
			'card',
			array( 'title' => 'Settings' ),
			static function () {
				return gutenberg_get_ui_component( 'button', array( 'label' => 'Save' ) );
			}
		);
		$with_string    = (string) gutenberg_get_ui_component(
			'card',
			array( 'title' => 'Settings' ),
			static function () {
				return '<script>alert(1)</script>';
			}
		);

		$this->assertSame( 1, substr_count( $with_component, '<button' ) );
		$this->assertStringNotContainsString( '<script>', $with_string );
	}

	public function test_mixes_a_list_of_content() {
		$html = (string) gutenberg_get_ui_component(
			'card',
			array( 'title' => 'Settings' ),
			array(
				'<b>Text</b>',
				gutenberg_get_ui_component( 'button', array( 'label' => 'Save' ) ),
			)
		);

		$this->assertStringContainsString( '&lt;b&gt;Text&lt;/b&gt;', $html );
		$this->assertSame( 1, substr_count( $html, '<button' ) );
	}

	public function test_sanitized_content_drops_scripts_and_event_handlers() {
		$html = (string) gutenberg_get_ui_component(
			'card',
			array( 'title' => 'Settings' ),
			Gutenberg_UI_Safe_HTML::sanitized( '<a href="https://example.org" onclick="alert(1)">Docs</a><script>alert(1)</script>' )
		);

		$this->assertStringContainsString( '<a href="https://example.org">Docs</a>', $html );
		$this->assertStringNotContainsString( 'onclick', $html );
		$this->assertStringNotContainsString( '<script>', $html );
	}

	public function test_content_is_never_read_as_a_placeholder() {
		$html = (string) gutenberg_get_ui_component( 'card', array( 'title' => 'Settings' ), '__wpuislot_title__text__' );

		$this->assertStringContainsString( '__wpuislot_title__text__', $html );
	}

	/**
	 * @expectedIncorrectUsage Gutenberg_UI_Components::render
	 */
	public function test_ignores_content_for_a_component_that_does_not_accept_it() {
		$called = false;
		$html   = (string) gutenberg_get_ui_component(
			'button',
			array( 'label' => 'Save' ),
			static function () use ( &$called ) {
				$called = true;
			}
		);

		$this->assertFalse( $called, 'Ignored content must not run.' );
		$this->assertSame( (string) gutenberg_get_ui_component( 'button', array( 'label' => 'Save' ) ), $html );
	}

	public function test_a_closure_that_throws_leaves_no_output_buffer_open() {
		$level = ob_get_level();

		try {
			gutenberg_get_ui_component(
				'card',
				array( 'title' => 'Settings' ),
				static function () {
					echo 'Partial';
					throw new RuntimeException( 'Failed' );
				}
			);
		} catch ( RuntimeException $e ) {
			$this->assertSame( 'Failed', $e->getMessage() );
		}

		$this->assertSame( $level, ob_get_level() );
	}

	public function test_escapes_objects_that_print() {
		$content = new class() {
			public function __toString() {
				return '<script>alert(1)</script>';
			}
		};

		$html = (string) gutenberg_get_ui_component( 'card', array( 'title' => 'Settings' ), $content );

		$this->assertStringContainsString( '&lt;script&gt;', $html );
		$this->assertStringNotContainsString( '<script>', $html );
	}

	/**
	 * @expectedIncorrectUsage Gutenberg_UI_Components::render
	 */
	public function test_unknown_component_renders_nothing() {
		$this->assertSame( '', (string) gutenberg_get_ui_component( 'not-a-component' ) );
	}

	/**
	 * @expectedIncorrectUsage Gutenberg_UI_Components::render
	 */
	public function test_missing_required_prop_renders_nothing() {
		$this->assertSame( '', (string) gutenberg_get_ui_component( 'button' ) );
	}

	/**
	 * @expectedIncorrectUsage Gutenberg_UI_Components::render
	 */
	public function test_invalid_prop_value_falls_back_to_default() {
		$this->assertSame(
			(string) gutenberg_get_ui_component( 'button', array( 'label' => 'Save' ) ),
			(string) gutenberg_get_ui_component(
				'button',
				array(
					'label' => 'Save',
					'type'  => '"><script>',
				)
			)
		);
	}

	/**
	 * @expectedIncorrectUsage Gutenberg_UI_Components::render
	 */
	public function test_unknown_prop_is_ignored() {
		$this->assertSame(
			(string) gutenberg_get_ui_component( 'button', array( 'label' => 'Save' ) ),
			(string) gutenberg_get_ui_component(
				'button',
				array(
					'label'   => 'Save',
					'onClick' => 'alert(1)',
				)
			)
		);
	}

	/**
	 * Normalizes HTML so two renders can be compared: attributes and class names
	 * are sorted, whitespace-only text is dropped, IDs and the attributes that
	 * refer to them are numbered in order of appearance, and self-closing SVG tags
	 * and inline styles are written one way.
	 *
	 * @param string $html HTML.
	 * @return array List of tokens.
	 */
	private static function normalize_html( $html ) {
		$tokens    = array();
		$ids       = array();
		$processor = new WP_HTML_Tag_Processor( $html );

		while ( $processor->next_token() ) {
			$type = $processor->get_token_type();

			if ( '#text' === $type ) {
				$text = trim( $processor->get_modifiable_text() );
				if ( '' !== $text ) {
					$tokens[] = $text;
				}
				continue;
			}

			if ( '#tag' !== $type ) {
				continue;
			}

			if ( $processor->is_tag_closer() ) {
				$tokens[] = '</' . strtolower( $processor->get_tag() ) . '>';
				continue;
			}

			$attributes = array();
			foreach ( $processor->get_attribute_names_with_prefix( '' ) as $name ) {
				$value = $processor->get_attribute( $name );
				if ( in_array( $name, array( 'id', 'for', 'aria-controls', 'aria-describedby', 'aria-labelledby' ), true ) ) {
					$references = array();
					foreach ( preg_split( '/\s+/', trim( (string) $value ) ) as $id ) {
						if ( ! isset( $ids[ $id ] ) ) {
							$ids[ $id ] = '#' . count( $ids );
						}
						$references[] = $ids[ $id ];
					}
					$value = implode( ' ', $references );
				}
				if ( 'class' === $name ) {
					$classes = preg_split( '/\s+/', trim( (string) $value ) );
					sort( $classes );
					$value = implode( ' ', $classes );
				} elseif ( 'style' === $name ) {
					$declarations = explode( ';', preg_replace( '/\s*([:;])\s*/', '$1', trim( (string) $value, ' ;' ) ) );
					sort( $declarations );
					$value = implode( ';', $declarations );
				}
				$attributes[ $name ] = true === $value ? '' : $value;
			}
			ksort( $attributes );

			$tokens[] = array(
				'tag'        => strtolower( $processor->get_tag() ),
				'attributes' => $attributes,
			);
			if ( $processor->has_self_closing_flag() ) {
				$tokens[] = '</' . strtolower( $processor->get_tag() ) . '>';
			}
		}

		return $tokens;
	}
}
