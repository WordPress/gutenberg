<?php
/**
 * Plugin Name: WP Custom Settings (Individual Options)
 * Description: A simple plugin to demonstrate different types of settings fields in WordPress with each field stored separately.
 * Version: 1.0
 * Author: Gutenberg
 */

// Hook to add the settings page in the admin menu
add_action( 'admin_menu', 'wpcs_add_admin_menu' );
add_action( 'admin_init', 'wpcs_settings_init' );
// Hook to add the settings to the REST API
add_action( 'rest_api_init', 'wpcs_register_settings' );

// Function to add the settings page to the admin menu
function wpcs_add_admin_menu() {
	gutenberg_add_options_page(
		'Custom Settings Page',    // Page title
		'Custom Settings',         // Menu title
		'manage_options',          // Capability
		'wpcs_custom_settings',    // Menu slug
		'wpcs_options_page'        // Callback function
	);
}

// Register setting fields for admin and REST API
function wpcs_register_settings() {
    register_setting( 'wpcs_settings_group', 'wpcs_text_field', array( 'show_in_rest' => true, 'type' => 'string' ) );
    register_setting( 'wpcs_settings_group', 'wpcs_checkbox_field', array( 'show_in_rest' => true, 'type' => 'boolean' ) );
    register_setting( 'wpcs_settings_group', 'wpcs_radio_field', array( 'show_in_rest' => true, 'type' => 'string' ) );
    register_setting( 'wpcs_settings_group', 'wpcs_select_field', array( 'show_in_rest' => true, 'type' => 'string' ) );
    register_setting( 'wpcs_settings_group', 'wpcs_color_field', array( 'show_in_rest' => true, 'type' => 'string' ) );
    register_setting( 'wpcs_settings_group', 'wpcs_file_field', array( 'show_in_rest' => true, 'type' => 'string' ) );
}

// Initialize settings and register settings fields
function wpcs_settings_init() {

	// Section
	add_settings_section(
		'wpcs_general_section',            // Section ID
		'Custom Settings',                 // Section title
		'wpcs_section_callback',           // Section callback
		'wpcs_custom_settings'             // Page slug
	);

    wpcs_register_settings();

	// Text Field
	add_settings_field(
		'wpcs_text_field',
		'Text Field',
		'wpcs_text_field_render',
		'wpcs_custom_settings',
		'wpcs_general_section'
	);

	// Checkbox Field
	add_settings_field(
		'wpcs_checkbox_field',
		'Checkbox Field',
		'wpcs_checkbox_field_render',
		'wpcs_custom_settings',
		'wpcs_general_section'
	);

	// Radio Button Field
	add_settings_field(
		'wpcs_radio_field',
		'Radio Button Field',
		'wpcs_radio_field_render',
		'wpcs_custom_settings',
		'wpcs_general_section'
	);

	// Dropdown (Select) Field
	add_settings_field(
		'wpcs_select_field',
		'Dropdown Field',
		'wpcs_select_field_render',
		'wpcs_custom_settings',
		'wpcs_general_section'
	);

	// Color Picker Field
	add_settings_field(
		'wpcs_color_field',
		'Color Picker Field',
		'wpcs_color_field_render',
		'wpcs_custom_settings',
		'wpcs_general_section'
	);

	// File Upload Field
	add_settings_field(
		'wpcs_file_field',
		'File Upload Field',
		'wpcs_file_field_render',
		'wpcs_custom_settings',
		'wpcs_general_section'
	);
}

// Render Callback Functions for each field type
function wpcs_text_field_render() {
	$value = get_option( 'wpcs_text_field', '' );
	?>
	<input type='text' name='wpcs_text_field' value='<?php echo esc_attr( $value ); ?>'>
	<?php
}

function wpcs_checkbox_field_render() {
	$value = get_option( 'wpcs_checkbox_field', 0 );
	?>
	<input type='checkbox' name='wpcs_checkbox_field' value='1' <?php checked( 1, $value, true ); ?>>
	<?php
}

function wpcs_radio_field_render() {
	$value = get_option( 'wpcs_radio_field', '' );
	?>
	<input type='radio' name='wpcs_radio_field' value='option1' <?php checked( $value, 'option1' ); ?>> Option 1<br>
	<input type='radio' name='wpcs_radio_field' value='option2' <?php checked( $value, 'option2' ); ?>> Option 2
	<?php
}

function wpcs_select_field_render() {
	$value = get_option( 'wpcs_select_field', '' );
	?>
	<select name='wpcs_select_field'>
		<option value='option1' <?php selected( $value, 'option1' ); ?>>Option 1</option>
		<option value='option2' <?php selected( $value, 'option2' ); ?>>Option 2</option>
		<option value='option3' <?php selected( $value, 'option3' ); ?>>Option 3</option>
	</select>
	<?php
}

function wpcs_color_field_render() {
	$value = get_option( 'wpcs_color_field', '#ffffff' );
	?>
	<input type='text' class='wpcs-color-field' name='wpcs_color_field' value='<?php echo esc_attr( $value ); ?>'>
	<script>
		jQuery(document).ready(function($){
			$('.wpcs-color-field').wpColorPicker();
		});
	</script>
	<?php
}

function wpcs_file_field_render() {
	$value = get_option( 'wpcs_file_field', '' );
	?>
	<input type='file' name='wpcs_file_upload'>
	<?php if ( ! empty( $value ) ) : ?>
		<p>Current file: <a href="<?php echo esc_url( $value ); ?>" target="_blank"><?php echo esc_html( $value ); ?></a></p>
	<?php endif; ?>
	<?php
}

// Section Callback
function wpcs_section_callback() {
	echo 'Customize the following settings:';
}

// The Settings Page Output
function wpcs_options_page() {
	?>
	<form action='options.php' method='post' enctype="multipart/form-data">
		<?php
		settings_fields( 'wpcs_settings_group' );
		do_settings_sections( 'wpcs_custom_settings' );
		submit_button();
		?>
	</form>
	<?php
}

// Handle file upload after form submission
add_action( 'admin_init', 'wpcs_handle_file_upload' );
function wpcs_handle_file_upload() {
	if ( isset( $_FILES['wpcs_file_upload'] ) && ! empty( $_FILES['wpcs_file_upload']['name'] ) ) {
		$uploadedfile     = $_FILES['wpcs_file_upload'];
		$upload_overrides = array( 'test_form' => false );
		$movefile         = wp_handle_upload( $uploadedfile, $upload_overrides );

		if ( $movefile && ! isset( $movefile['error'] ) ) {
			update_option( 'wpcs_file_field', $movefile['url'] );
		}
	}
}

// Enqueue WordPress color picker
add_action( 'admin_enqueue_scripts', 'wpcs_enqueue_color_picker' );
function wpcs_enqueue_color_picker( $hook_suffix ) {
	// Ensure color picker is loaded on our settings page only
	if ( $hook_suffix === 'settings_page_wpcs_custom_settings' ) {
		wp_enqueue_style( 'wp-color-picker' );
		wp_enqueue_script( 'wp-color-picker' );
	}
}
