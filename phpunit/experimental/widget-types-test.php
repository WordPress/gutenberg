<?php
/**
 * Unit tests for the widget types registration helpers.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_translate_widget_metadata
 * @covers ::gutenberg_get_widget_metadata_i18n_schema
 * @covers ::gutenberg_sanitize_widget_help
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

		$this->assertSame( 'widget title', $schema->title );
		$this->assertSame( 'widget description', $schema->description );
		$this->assertSame( 'widget help content', $schema->help->content );
		$this->assertSame(
			'widget help link label',
			$schema->help->links[0]->label
		);
		$this->assertSame( array( 'widget keyword' ), $schema->keywords );
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
				'help'        => array(
					'content' => 'Welcome at a glance.',
					'links'   => array(
						array(
							'label' => 'Learn more',
							'href'  => 'about.php',
						),
					),
				),
				'keywords'    => array( 'start' ),
				'category'    => 'dashboard',
				'textdomain'  => 'default',
			)
		);

		$this->assertSame( 'Bienvenido', $widget['title'] );
		$this->assertSame( 'Muestra un panel de bienvenida.', $widget['description'] );
		$this->assertSame( 'Bienvenida de un vistazo.', $widget['help']['content'] );
		$this->assertSame( 'Más información', $widget['help']['links'][0]['label'] );
		$this->assertSame( 'about.php', $widget['help']['links'][0]['href'] );
		$this->assertSame( array( 'inicio' ), $widget['keywords'] );
		$this->assertSame( 'dashboard', $widget['category'] );
	}

	/**
	 * The help content keeps minimal emphasis, everything else is stripped,
	 * and malformed links are dropped.
	 */
	public function test_sanitize_widget_help_constrains_markup_and_links() {
		$help = gutenberg_sanitize_widget_help(
			array(
				'content' => 'Keep <em>emphasis</em> and <strong>bold</strong>, drop <a href="https://example.com">links</a>.',
				'links'   => array(
					array(
						'label' => 'Valid',
						'href'  => 'site-health.php',
					),
					array( 'label' => 'Missing href' ),
				),
			)
		);

		$this->assertSame( 'Keep <em>emphasis</em> and <strong>bold</strong>, drop links.', $help['content'] );
		$this->assertSame(
			array(
				array(
					'label' => 'Valid',
					'href'  => 'site-health.php',
				),
			),
			$help['links']
		);
	}

	/**
	 * A help note without content is meaningless and normalizes to null.
	 */
	public function test_sanitize_widget_help_requires_content() {
		$this->assertNull( gutenberg_sanitize_widget_help( null ) );
		$this->assertNull( gutenberg_sanitize_widget_help( array( 'links' => array() ) ) );
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
			'widget title'           => array( 'Welcome' => 'Bienvenido' ),
			'widget description'     => array( 'Displays a welcome panel.' => 'Muestra un panel de bienvenida.' ),
			'widget help content'    => array( 'Welcome at a glance.' => 'Bienvenida de un vistazo.' ),
			'widget help link label' => array( 'Learn more' => 'Más información' ),
			'widget keyword'         => array( 'start' => 'inicio' ),
		);

		if ( 'default' === $domain && isset( $messages[ $context ][ $text ] ) ) {
			return $messages[ $context ][ $text ];
		}

		return $translation;
	}
}
