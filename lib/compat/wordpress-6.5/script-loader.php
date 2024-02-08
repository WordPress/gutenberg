<?php
/**
 * Updates the script-loader.php file
 *
 * @package gutenberg
 */

/**
 * Prints inline JavaScript wrapped in `<script>` tag.
 *
 * It is possible to inject attributes in the `<script>` tag via the  {@see 'wp_script_attributes'}  filter.
 * Automatically injects type attribute if needed.
 *
 * @since 5.7.0
 *
 * @param string $javascript Inline JavaScript code.
 * @param array  $attributes Optional. Key-value pairs representing `<script>` tag attributes.
 */
function gutenberg_print_inline_script_tag( $javascript, $attributes = array() ) {
	echo gutenberg_get_inline_script_tag( $javascript, $attributes );
}


/**
 * Wraps inline JavaScript in `<script>` tag.
 *
 * It is possible to inject attributes in the `<script>` tag via the  {@see 'wp_script_attributes'}  filter.
 * Automatically injects type attribute if needed.
 *
 * @since 5.7.0
 *
 * @param string $javascript Inline JavaScript code.
 * @param array  $attributes Optional. Key-value pairs representing `<script>` tag attributes.
 * @return string String containing inline JavaScript code wrapped around `<script>` tag.
 */
function gutenberg_get_inline_script_tag( $data, $attributes = array() ) {
	$is_html5 = current_theme_supports( 'html5', 'script' ) || is_admin();
	if ( ! isset( $attributes['type'] ) && ! $is_html5 ) {
		// Keep the type attribute as the first for legacy reasons (it has always been this way in core).
		$attributes = array_merge(
			array( 'type' => 'text/javascript' ),
			$attributes
		);
	}

	/*
	 * XHTML extracts the contents of the SCRIPT element and then the XML parser
	 * decodes character references and other syntax elements. This can lead to
	 * misinterpretation of the script contents or invalid XHTML documents.
	 *
	 * Wrapping the contents in a CDATA section instructs the XML parser not to
	 * transform the contents of the SCRIPT element before passing them to the
	 * JavaScript engine.
	 *
	 * Example:
	 *
	 *     <script>console.log('&hellip;');</script>
	 *
	 *     In an HTML document this would print "&hellip;" to the console,
	 *     but in an XHTML document it would print "…" to the console.
	 *
	 *     <script>console.log('An image is <img> in HTML');</script>
	 *
	 *     In an HTML document this would print "An image is <img> in HTML",
	 *     but it's an invalid XHTML document because it interprets the `<img>`
	 *     as an empty tag missing its closing `/`.
	 *
	 * @see https://www.w3.org/TR/xhtml1/#h-4.8
	 */
	if (
		! $is_html5 &&
		(
			! isset( $attributes['type'] ) ||
			'module' === $attributes['type'] ||
			str_contains( $attributes['type'], 'javascript' ) ||
			str_contains( $attributes['type'], 'ecmascript' ) ||
			str_contains( $attributes['type'], 'jscript' ) ||
			str_contains( $attributes['type'], 'livescript' )
		)
	) {
		/*
		 * If the string `]]>` exists within the JavaScript it would break
		 * out of any wrapping CDATA section added here, so to start, it's
		 * necessary to escape that sequence which requires splitting the
		 * content into two CDATA sections wherever it's found.
		 *
		 * Note: it's only necessary to escape the closing `]]>` because
		 * an additional `<![CDATA[` leaves the contents unchanged.
		 */
		$data = str_replace( ']]>', ']]]]><![CDATA[>', $data );

		// Wrap the entire escaped script inside a CDATA section.
		$data = sprintf( "/* <![CDATA[ */\n%s\n/* ]]> */", $data );
	}

	$data = "\n" . trim( $data, "\n\r " ) . "\n";

	/**
	 * Filters attributes to be added to a script tag.
	 *
	 * @since 5.7.0
	 *
	 * @param array  $attributes Key-value pairs representing `<script>` tag attributes.
	 *                           Only the attribute name is added to the `<script>` tag for
	 *                           entries with a boolean value, and that are true.
	 * @param string $data       Inline data.
	 */
	$attributes = apply_filters( 'wp_inline_script_attributes', $attributes, $data );

	return sprintf( "<script%s>%s</script>\n", wp_sanitize_script_attributes( $attributes ), $data );
}
