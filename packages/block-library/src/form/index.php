<?php
/**
 * Server-side rendering of the `core/form` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/form` block on server.
 *
 * @param array  $attributes The block attributes.
 * @param string $content The saved content.
 *
 * @return string The content of the block being rendered.
 */
function render_block_core_form( $attributes, $content ) {

	$processed_content = new WP_HTML_Tag_Processor( $content );
	$processed_content->next_tag( 'form' );

	// Get the action for this form.
	$action = '';
	if ( isset( $attributes['action'] ) ) {
		$action = str_replace(
			array( '{SITE_URL}', '{ADMIN_URL}' ),
			array( site_url(), admin_url() ),
			$attributes['action']
		);
	}

	if ( ! empty( $action ) ) {
		$processed_content->set_attribute( 'action', esc_attr( $action ) );
	}

	/*
	 * Add the method attribute. If it is not set, default to `post`.
	 * If the user has set the method to `email`, change it to `post`.
	 */
	$method = empty( $attributes['method'] ) || 'email' === $attributes['method']
		? 'post'
		: $attributes['method'];
	$processed_content->set_attribute( 'method', $method );

	$extra_fields = apply_filters( 'render_block_core_form_extra_fields', '', $attributes );

	return str_replace(
		'</form>',
		$extra_fields . '</form>',
		$processed_content->get_updated_html()
	);
}

/**
 * Adds extra fields to the form.
 *
 * If the form is a comment form, adds the post ID as a hidden field,
 * to allow the comment to be associated with the post.
 *
 * @param string $extra_fields The extra fields.
 * @param array  $attributes   The block attributes.
 *
 * @return string The extra fields.
 */
function gutenberg_block_core_form_extra_fields_comment_form( $extra_fields, $attributes ) {
	if ( ! empty( $attributes['action'] ) && str_ends_with( $attributes['action'], '/wp-comments-post.php' ) ) {
		$extra_fields .= '<input type="hidden" name="comment_post_ID" value="' . get_the_ID() . '" id="comment_post_ID">';
	}
	return $extra_fields;
}
add_filter( 'render_block_core_form_extra_fields', 'gutenberg_block_core_form_extra_fields_comment_form', 10, 2 );

/**
 * Adds extra fields to the form.
 *
 * If the form does not have an `action` defined, assume this is a contact form.
 * Adds a nonce field and a hidden input to enable sending an email
 * to the admin when the form is submitted.
 *
 * @param string $extra_fields The extra fields.
 * @param array  $attributes   The block attributes.
 *
 * @return string The extra fields.
 */
function gutenberg_block_core_form_extra_fields_email( $extra_fields, $attributes ) {
	if ( 'email' === $attributes['method'] ) {
		$extra_fields .= wp_nonce_field( 'wp-block-form', 'wp_block_form', true, false );
		$extra_fields .= '<input type="hidden" name="wp-send-email" value="1">';
		$email_address = empty( $attributes['email'] ) ? get_option( 'admin_email' ) : $attributes['email'];
		$extra_fields .= '<input type="hidden" name="wp-email-address" value="' . esc_attr( $email_address ) . '">';
	}
	return $extra_fields;
}
add_filter( 'render_block_core_form_extra_fields', 'gutenberg_block_core_form_extra_fields_email', 10, 2 );

/**
 * Sends an email if the form is a contact form.
 *
 * @return void
 */
function gutenberg_block_core_form_send_email() {
	// Get the POST or GET data.
	$params = wp_unslash( $_POST );

	// Bail early if not a form submission, or if the nonce is not valid.
	if ( empty( $params['wp_block_form'] )
		|| empty( $params['wp-send-email'] )
		|| '1' !== $params['wp-send-email']
		|| ! wp_verify_nonce( $params['wp_block_form'], 'wp-block-form' )
		|| empty( $params['wp-email-address'] )
	) {
		return;
	}

	// Start building the email content.
	$content = sprintf(
		/* translators: %s: The request URI. */
		__( 'Form submission from %1$s', 'gutenberg' ) . '</br>',
		'<a href="' . esc_url( get_site_url( null, $params['_wp_http_referer'] ) ) . '">' . get_bloginfo( 'name' ) . '</a>'
	);

	$skip_fields = array( 'wp_block_form', '_wp_http_referer', 'wp-send-email', 'wp-email-address' );
	foreach ( $params as $key => $value ) {
		if ( in_array( $key, $skip_fields, true ) ) {
			continue;
		}
		$content .= sanitize_key( $key ) . ': ' . wp_kses_post( $value ) . '</br>';
	}

	// Filter the email content.
	$content = apply_filters( 'render_block_core_form_email_content', $content, $params );

	// Send the email.
	wp_mail( $params['wp-email-address'], __( 'Form submission', 'gutenberg' ), $content );

	/**
	 * Fires after the email has been sent.
	 *
	 * This will allow 3rd-party plugins to redirect to a different page
	 * by removing the default redirect, or add a success message etc.
	 *
	 * @param array $params The POST data.
	 */
	do_action( 'render_block_core_form_email_sent', $params );
}
add_action( 'wp', 'gutenberg_block_core_form_send_email' );

/**
 * Redirect to the same page when the form has been submitted and an email was sent.
 *
 * @param array $params The POST data.
 */
function gutenberg_block_core_form_email_sent( $params ) {
	wp_safe_redirect( get_site_url( null, $params['_wp_http_referer'] ) );
	exit;
}
add_action( 'render_block_core_form_email_sent', 'gutenberg_block_core_form_email_sent' );

/**
 * Send the data export/remove request if the form is a privacy-request form.
 *
 * @return void
 */
function gutenberg_block_core_form_privacy_form() {
	// Get the POST data.
	$params = wp_unslash( $_POST );

	// Bail early if not a form submission, or if the nonce is not valid.
	if ( empty( $params['wp-action'] )
		|| 'wp_privacy_send_request' !== $params['wp-action']
		|| empty( $params['wp-privacy-request'] )
		|| '1' !== $params['wp-privacy-request']
		|| empty( $params['email'] )
	) {
		return;
	}

	// Get the request types.
	$request_types  = _wp_privacy_action_request_types();
	$requests_found = array();
	foreach ( $request_types as $request_type ) {
		if ( ! empty( $params[ $request_type ] ) ) {
			$requests_found[] = $request_type;
		}
	}

	// Bail early if no requests were found.
	if ( empty( $requests_found ) ) {
		return;
	}

	// Process the requests.
	$actions_errored   = array();
	$actions_performed = array();
	foreach ( $requests_found as $action_name ) {
		// Get the request ID.
		$request_id = wp_create_user_request( $params['email'], $action_name );

		// Bail early if the request ID is invalid.
		if ( is_wp_error( $request_id ) ) {
			$actions_errored[] = $action_name;
			continue;
		}

		// Send the request email.
		wp_send_user_request( $request_id );
		$actions_performed[] = $action_name;
	}

	// Add feedback to the top of the form when the page re-renders.
	$privacy_form_feedback = static function( $block_content ) use ( $actions_errored, $actions_performed ) {
		// Bail early if no actions were detected.
		if ( empty( $actions_errored ) && empty( $actions_performed ) ) {
			return $block_content;
		}

		// Bail early if this is not a privacy form.
		if ( false === strpos( $block_content, 'wp_privacy_send_request' ) ) {
			return $block_content;
		}

		if ( ! empty( $actions_errored ) ) {
			$feedback  = '<div class="wp-privacy-request-error" style="padding:1em;border:1px solid #EA8484;background:#FBEAEA;color:#9A2323;border-radius:3px;">';
			$feedback .= '<p>' . __( 'There was a problem with your action. Please try again later.', 'gutenberg' ) . '</p>';
			$feedback .= '</div>';
		} else {
			$feedback  = '<div class="wp-privacy-request-success" style="padding:1em;border:1px solid #B5E1B9;background:#ECF7ED;color:#31843F;border-radius:3px;">';
			$feedback .= '<p>' . __( 'Confirmation request initiated successfully. Please check your email for confirmation.', 'gutenberg' ) . '</p>';
			$feedback .= '</div>';
		}

		return $feedback . $block_content;
	};
	add_action( 'render_block_core/form', $privacy_form_feedback );
}
add_action( 'wp', 'gutenberg_block_core_form_privacy_form' );

/**
 * Registers the `core/form` block on server.
 */
function register_block_core_form() {
	register_block_type_from_metadata(
		__DIR__ . '/form',
		array(
			'render_callback' => 'render_block_core_form',
		)
	);
}
add_action( 'init', 'register_block_core_form' );
