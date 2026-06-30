<?php
/**
 * Unit tests for the widget types registration helpers.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_translate_widget_metadata
 * @covers ::gutenberg_get_widget_metadata_i18n_schema
 */
class Gutenberg_Widget_Types_Test extends WP_UnitTestCase {

	public function tear_down() {
		remove_filter( 'gettext_with_context', array( $this, 'translate_to_spanish' ), 10 );
		parent::tear_down();
	}

	/**
	 * The schema maps each translatable field to its gettext context.
	 */
	public function test_i18n_schema_declares_translatable_fields() {
		$schema = gutenberg_get_widget_metadata_i18n_schema();

		$this->assertSame( 'widget title', $schema['title'] );
		$this->assertSame( 'widget description', $schema['description'] );
		$this->assertSame( array( 'widget keyword' ), $schema['keywords'] );
	}

	/**
	 * Translatable strings are localized using the widget's text domain,
	 * while non-translatable keys pass through untouched.
	 */
	public function test_translate_widget_metadata_localizes_strings() {
		add_filter( 'gettext_with_context', array( $this, 'translate_to_spanish' ), 10, 4 );

		$widget = gutenberg_translate_widget_metadata(
			array(
				'name'        => 'core/welcome',
				'title'       => 'Welcome',
				'description' => 'Displays a welcome panel.',
				'keywords'    => array( 'start' ),
				'category'    => 'dashboard',
				'textdomain'  => 'default',
			)
		);

		$this->assertSame( 'Bienvenido', $widget['title'] );
		$this->assertSame( 'Muestra un panel de bienvenida.', $widget['description'] );
		$this->assertSame( array( 'inicio' ), $widget['keywords'] );
		$this->assertSame( 'dashboard', $widget['category'] );
	}

	/**
	 * Without a text domain there is nothing to translate against.
	 */
	public function test_translate_widget_metadata_without_textdomain_is_noop() {
		add_filter( 'gettext_with_context', array( $this, 'translate_to_spanish' ), 10, 4 );

		$widget = gutenberg_translate_widget_metadata(
			array(
				'name'  => 'core/welcome',
				'title' => 'Welcome',
			)
		);

		$this->assertSame( 'Welcome', $widget['title'] );
	}

	/**
	 * Fake es_ES provider for the widget gettext contexts.
	 *
	 * @param string $translation Current translation.
	 * @param string $text        Source text.
	 * @param string $context     Gettext context.
	 * @param string $domain      Text domain.
	 * @return string Translated string.
	 */
	public function translate_to_spanish( $translation, $text, $context, $domain ) {
		$messages = array(
			'widget title'       => array( 'Welcome' => 'Bienvenido' ),
			'widget description' => array( 'Displays a welcome panel.' => 'Muestra un panel de bienvenida.' ),
			'widget keyword'     => array( 'start' => 'inicio' ),
		);

		if ( 'default' === $domain && isset( $messages[ $context ][ $text ] ) ) {
			return $messages[ $context ][ $text ];
		}

		return $translation;
	}
}
