<?php
/**
 * HTML that's safe to print, as returned by `gutenberg_get_ui_component()`.
 *
 * @package gutenberg
 */

/**
 * HTML that's safe to print without escaping.
 *
 * Components return their markup as this object instead of a plain string, so
 * a component can tell its content apart: a plain string is escaped, while
 * this is inserted as HTML. It prints like a string, so `echo` works as usual.
 *
 * Only components create it, plus `sanitized()` for HTML from elsewhere, which
 * removes what post content can't contain. There's no way to mark HTML as safe
 * as it is, and it can't be unserialized.
 *
 * This is a stand-in: the context-aware templating explored in
 * wordpress-develop#5949 could replace it.
 */
final class Gutenberg_UI_Safe_HTML {

	/**
	 * The HTML.
	 *
	 * @var string
	 */
	private $html;

	/**
	 * Use `sanitized()` instead. Components create it through
	 * `gutenberg_ui_components_safe_html()`.
	 *
	 * @param string $html HTML.
	 */
	private function __construct( $html ) {
		$this->html = (string) $html;
	}

	/**
	 * Makes HTML safe to pass as content, by removing what post content can't
	 * contain, such as scripts and event handlers.
	 *
	 * @param string $html HTML from any source.
	 * @return Gutenberg_UI_Safe_HTML Sanitized HTML.
	 */
	public static function sanitized( $html ) {
		return new self( wp_kses_post( (string) $html ) );
	}

	/**
	 * Returns the HTML.
	 *
	 * @return string HTML.
	 */
	public function __toString() {
		return $this->html;
	}

	/**
	 * Prevents creating it by unserializing a value.
	 *
	 * @throws LogicException Always.
	 */
	public function __wakeup() {
		throw new LogicException( 'Gutenberg_UI_Safe_HTML can\'t be unserialized.' );
	}

	/**
	 * Prevents creating it by unserializing a value.
	 *
	 * @param array $data Unserialized data.
	 * @throws LogicException Always.
	 */
	public function __unserialize( array $data ) {
		unset( $data );
		throw new LogicException( 'Gutenberg_UI_Safe_HTML can\'t be unserialized.' );
	}
}
