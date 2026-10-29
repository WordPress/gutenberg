<?php
/**
 * Links to the Storybook build bundled into pull request preview zips.
 *
 * This file is not part of the Gutenberg plugin. The `build-plugin-zip.yml`
 * workflow adds it, together with the Storybook build, only to the zip built
 * for a pull request, so that the WordPress Playground preview of that pull
 * request can open the pull request's Storybook too.
 *
 * @package gutenberg
 */

add_action(
	'admin_bar_menu',
	static function ( $wp_admin_bar ) {
		if ( ! current_user_can( 'read' ) ) {
			return;
		}

		$wp_admin_bar->add_node(
			array(
				'id'    => 'gutenberg-storybook-preview',
				'title' => 'Storybook',
				'href'  => plugins_url( 'storybook/index.html', __FILE__ ),
			)
		);
	},
	100
);

add_action(
	'admin_menu',
	static function () {
		add_menu_page(
			'Storybook',
			'Storybook',
			'read',
			plugins_url( 'storybook/index.html', __FILE__ ),
			'',
			'dashicons-book-alt'
		);
	}
);
