<?php

/**
 * Print data associated with Script Modules in Script tags.
 *
 * This embeds data in the page HTML so that it is available on page load.
 *
 * Data can be associated with a given Script Module by using the
 * `script_module_data_{$module_id}` filter.
 *
 * The data for a given Script Module will be JSON serialized in a script tag with an ID
 * like `wp-script-module-data-{$module_id}`.
 */
function gutenberg_print_script_module_data(): void {
	$get_marked_for_enqueue = new ReflectionMethod( 'WP_Script_Modules', 'get_marked_for_enqueue' );
	$get_marked_for_enqueue->setAccessible( true );
	$get_import_map = new ReflectionMethod( 'WP_Script_Modules', 'get_import_map' );
	$get_import_map->setAccessible( true );

	$modules = array();
	foreach ( array_keys( $get_marked_for_enqueue->invoke( wp_script_modules() ) ) as $id ) {
		$modules[ $id ] = true;
	}
	foreach ( array_keys( $get_import_map->invoke( wp_script_modules() )['imports'] ) as $id ) {
		$modules[ $id ] = true;
	}

	foreach ( array_keys( $modules ) as $module_id ) {
		/**
		 * Filters data associated with a given Script Module.
		 *
		 * Script Modules may require data that is required for initialization or is essential to
		 * have immediately available on page load. These are suitable use cases for this data.
		 *
		 * This is best suited to a minimal set of data and is not intended to replace the REST API.
		 *
		 * If the filter returns no data (an empty array), nothing will be embedded in the page.
		 *
		 * The data for a given Script Module, if provided, will be JSON serialized in a script tag
		 * with an ID like `wp-script-module-data-{$module_id}`.
		 *
		 * The dynamic portion of the hook name, `$module_id`, refers to the Script Module ID that
		 * the data is associated with.
		 *
		 * @param array $data The data that should be associated with the array.
		 */
		$data = apply_filters( "script_module_data_{$module_id}", array() );

		if ( is_array( $data ) && ! empty( $data ) ) {
			/*
			 * This data will be printed as JSON inside a script tag like this:
			 *   <script type="application/json"></script>
			 *
			 * A script tag must be closed by a sequence beginning with `</`. It's impossible to
			 * close a script tag without using `<`. We ensure that `<` is escaped and `/` can
			 * remain unescaped, so `</script>` will be printed as `\u003C/script\u00E3`.
			 *
			 *   - JSON_HEX_TAG: All < and > are converted to \u003C and \u003E.
			 *   - JSON_UNESCAPED_SLASHES: Don't escape /.
			 *
			 * If the page will use UTF-8 encoding, it's safe to print unescaped unicode:
			 *
			 *   - JSON_UNESCAPED_UNICODE: Encode multibyte Unicode characters literally (instead of as `\uXXXX`).
			 *   - JSON_UNESCAPED_LINE_TERMINATORS: The line terminators are kept unescaped when
			 *     JSON_UNESCAPED_UNICODE is supplied. It uses the same behaviour as it was
			 *     before PHP 7.1 without this constant. Available as of PHP 7.1.0.
			 *
			 * The JSON specification requires encoding in UTF-8, so if the generated HTML page
			 * is not encoded in UTF-8 then it's not safe to include those literals. They must
			 * be escaped to avoid encoding issues.
			 *
			 * @see https://www.rfc-editor.org/rfc/rfc8259.html for details on encoding requirements.
			 * @see https://www.php.net/manual/en/json.constants.php for details on these constants.
			 * @see https://html.spec.whatwg.org/#script-data-state for details on script tag parsing.
			 */
			$json_encode_flags = JSON_HEX_TAG | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_LINE_TERMINATORS;
			if ( 'UTF-8' !== get_option( 'blog_charset' ) ) {
				$json_encode_flags = JSON_HEX_TAG | JSON_UNESCAPED_SLASHES;
			}

			wp_print_inline_script_tag(
				wp_json_encode( $data, $json_encode_flags ),
				array(
					'type' => 'application/json',
					'id'   => "wp-script-module-data-{$module_id}",
				)
			);
		}
	}
}

add_action(
	'after_setup_theme',
	function () {
		if ( ! has_action( 'wp_footer', array( wp_script_modules(), 'print_script_module_data' ) ) ) {
			add_action( 'wp_footer', 'gutenberg_print_script_module_data' );
		}

		if ( ! has_action( 'admin_print_footer_scripts', array( wp_script_modules(), 'print_script_module_data' ) ) ) {
			add_action( 'admin_print_footer_scripts', 'gutenberg_print_script_module_data' );
		}
	},
	20
);
