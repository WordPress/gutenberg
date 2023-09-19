<?php
/**
 * Experiment to enable Command Palette everywhere in WordPress.
 *
 * @package gutenberg
 */

/**
 * Enqueue the command palette everywhere in WordPress.
 *
 * @package gutenberg
 */
function gutenberg_enqueue_commands() {
	if ( ! is_user_logged_in() ) {
		return;
	}

	wp_enqueue_style( 'wp-commands' );
	wp_enqueue_script( 'wp-core-commands' );
	wp_add_inline_script(
		'wp-core-commands',
		<<<'EOT'
			const { useCommands } = wp.coreCommands.unlock(wp.coreCommands.privateApis);
			const { RouterProvider } = wp.coreCommands.unlock(wp.router.privateApis);
			const mountPoint = document.createElement('div');

			mountPoint.id = 'wp-commands';
			document.body.appendChild(mountPoint);

			const root = wp.element.createRoot(mountPoint);

			function CommandMenuWrapper() {
			useCommands();
				return (
					wp.element.createElement(
						RouterProvider,
						null,
						wp.element.createElement(wp.commands.CommandMenu, null)
					)
				);
			}

			root.render(
				wp.element.createElement(CommandMenuWrapper, null)
			);
		EOT
	);
}

add_action( 'wp_print_scripts', 'gutenberg_enqueue_commands', 1 );
