<?php
/**
 * Block template functions.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_register_template' ) ) {
	/**
	 * Register a template.
	 *
	 * @param string       $template_name  Template name. It can only contain lowercase alphanumeric characters, dashes,
	 *                                     and underscores. See sanitize_key().
	 * @param array|string $args           Object type or array of object types with which the taxonomy should be associated.
	 * @param array|string $args           {
	 *     @type string        $title                 Optional. Title of the template as it will be shown in the Site Editor
	 *                                                and other UI elements.
	 *     @type string        $description           Optional. Description of the template as it will be shown in the Site
	 *                                                Editor.
	 *     @type string        $content               Optional. Default content of the template that will be used when the
	 *                                                template is rendered or edited in the editor.
	 *     @type string[]      $post_types            Optional. Array of post types to which the template should be available.
	 *     @type string        $plugin                Uri of the plugin that registers the template.
	 * }
	 * @return WP_Block_Template|WP_Error The registered template object on success, WP_Error object on failure.
	 */
	function wp_register_template( $template_name, $args = array() ) {
		return WP_Templates_Registry::get_instance()->register( $template_name, $args );
	}
}

if ( ! function_exists( 'wp_unregister_template' ) ) {
	/**
	 * Unregister a template.
	 *
	 * @param string       $template_id  Template id in the form of `plugin_uri//template_name`.
	 * @return true|WP_Error True on success, WP_Error on failure or if the template doesn't exist.
	 */
	function wp_unregister_template( $template_id ) {
		return WP_Templates_Registry::get_instance()->unregister( $template_id );
	}
}
