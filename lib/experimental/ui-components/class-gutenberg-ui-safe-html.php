<?php
/**
 * HTML that is safe to print, as returned by `@wordpress/ui` components.
 *
 * @package gutenberg
 */

/**
 * HTML that is safe to print without escaping.
 *
 * Components return their markup as this object instead of a plain string, so
 * that content passed to another component can tell the two apart: a plain
 * string is escaped, while this is inserted as HTML. It prints like a string,
 * so `echo` works as usual.
 *
 * Only components create it. Other code has to say explicitly why its HTML is
 * safe, with `sanitized()` or `trusted()`, so unescaped HTML never ends up in
 * a component by accident, and every exception is easy to find in review.
 */
final class Gutenberg_UI_Safe_HTML {

	/**
	 * The HTML.
	 *
	 * @var string
	 */
	private $html;

	/**
	 * Use `sanitized()` or `trusted()` instead.
	 *
	 * @param string $html HTML.
	 */
	private function __construct( $html ) {
		$this->html = (string) $html;
	}

	/**
	 * Marks HTML as safe after removing what post content can't contain, such
	 * as scripts and event handlers.
	 *
	 * @param string $html HTML from any source.
	 * @return Gutenberg_UI_Safe_HTML Sanitized HTML.
	 */
	public static function sanitized( $html ) {
		return new self( wp_kses_post( (string) $html ) );
	}

	/**
	 * Marks HTML as safe as it is.
	 *
	 * Only for HTML that the caller built and escaped itself, such as markup
	 * from another WordPress function. Never for anything a user entered.
	 *
	 * @param string $html HTML the caller vouches for.
	 * @return Gutenberg_UI_Safe_HTML Trusted HTML.
	 */
	public static function trusted( $html ) {
		return new self( $html );
	}

	/**
	 * Returns the HTML.
	 *
	 * @return string HTML.
	 */
	public function __toString() {
		return $this->html;
	}
}
