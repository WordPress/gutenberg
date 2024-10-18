<?php
/**
 * Block template functions.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'register_block_template' ) ) {
	/**
	 * Register a template.
	 *
	 * @param string       $template_name  Template name in the form of `plugin_uri//template_name`.
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
	function register_block_template( $template_name, $args = array() ) {
		return WP_Block_Templates_Registry::get_instance()->register( $template_name, $args );
	}
}

if ( ! function_exists( 'unregister_block_template' ) ) {
	/**
	 * Unregister a template.
	 *
	 * @param string $template_name Template name in the form of `plugin_uri//template_name`.
	 * @return WP_Block_Template|WP_Error The unregistered template object on success, WP_Error object on failure or if
	 *                                    the template doesn't exist.
	 */
	function unregister_block_template( $template_name ) {
		return WP_Block_Templates_Registry::get_instance()->unregister( $template_name );
	}
}

if ( ! function_exists( 'wp_register_block_template' ) ) {
	/**
	 * Register a template.
	 *
	 * @deprecated 19.4.0 wp_register_block_template is deprecated. Please use register_block_template instead.
	 *
	 * @param string       $template_name Template name in the form of `plugin_uri//template_name`.
	 * @param array|string $args {
	 *     Optional. Array or string of arguments for registering a block template.
	 *
	 *     @type string   $title       Optional. Title of the template as it will be shown in the Site Editor
	 *                                 and other UI elements.
	 *     @type string   $description Optional. Description of the template as it will be shown in the Site
	 *                                 Editor.
	 *     @type string   $content     Optional. Default content of the template that will be used when the
	 *                                 template is rendered or edited in the editor.
	 *     @type string[] $post_types  Optional. Array of post types to which the template should be available.
	 *     @type string   $plugin      Uri of the plugin that registers the template.
	 * }
	 * @return WP_Block_Template|WP_Error The registered template object on success, WP_Error object on failure.
	 */
	function wp_register_block_template( $template_name, $args = array() ) {
		_deprecated_function( __FUNCTION__, 'Gutenberg 19.4.0', 'register_block_template' );
		return register_block_template( $template_name, $args );
	}
}

if ( ! function_exists( 'wp_unregister_block_template' ) ) {
	/**
	 * Unregister a template.
	 *
	 * @deprecated 19.4.0 wp_unregister_block_template is deprecated. Please use unregister_block_template instead.
	 *
	 * @param string $template_name Template name in the form of `plugin_uri//template_name`.
	 * @return WP_Block_Template|WP_Error The unregistered template object on success, WP_Error object on failure or if
	 *                                    the template doesn't exist.
	 */
	function wp_unregister_block_template( $template_name ) {
		_deprecated_function( __FUNCTION__, 'Gutenberg 19.4.0', 'unregister_block_template' );
		return unregister_block_template( $template_name );
	}
}
