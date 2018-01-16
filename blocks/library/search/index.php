<?php
/**
 * Server-side rendering of the `core/search` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/search` block on server.
 *
 * Copied from get_search_form() because the core
 * search form function doesn't allow to change markup (yet).

 * @param array $attributes The block attributes.
 *
 * @return string Returns the search form markup.
 */
function gutenberg_render_block_core_search( $attributes ) {

	$search_form_template = locate_template( 'searchform.php' );
	if ( '' != $search_form_template ) {
		ob_start();
		require( $search_form_template );
		$form = ob_get_clean();
	} else {

		$defaults = array(
			'label'       => _x( 'Search for:', 'label' ),
			'placeholder' => esc_attr_x( 'Search &hellip;', 'placeholder' ),
			'submitValue' => esc_attr_x( 'Search', 'submit button' ),
		);

		$args = wp_parse_args( $attributes, $defaults );

		/**
		 * Filters the arguments used for the search form.
		 *
		 * @since x.x.x
		 *
		 * @param array $args The search form markup arguments.
		 */
		$args = apply_filters( 'get_search_form_args', $args );

		$form = '<form role="search" method="get" class="search-form" action="' . esc_url( home_url( '/' ) ) . '">
			<label>
				<span class="screen-reader-text">' . $args['label'] . '</span>
				<input type="search" class="search-field" placeholder="' . $args['placeholder'] . '" value="' . get_search_query() . '" name="s" />
			</label>
			<input type="submit" class="search-submit" value="' . $args['submitValue'] . '" />
		</form>';
	}

	/**
	 * Filters the HTML output of the search form.
	 *
	 * @since 2.7.0
	 *
	 * @param string $form The search form HTML output.
	 */
	$result = apply_filters( 'get_search_form', $form );

	if ( null === $result ) {
		$result = $form;
	}

	return $form;
}

register_block_type( 'core/search', array(
	'render_callback' => 'gutenberg_render_block_core_search',
) );
