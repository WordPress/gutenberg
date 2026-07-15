/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

// Simulates a second page that a third-party script has never touched. It
// reuses the same `id` on the `data-wp-preserve` wrapper, but with different
// server-rendered content, so tests can confirm the live version wins.
const html = `
		<div
			data-wp-interactive="directive-preserve"
			data-wp-router-region="test/directive-preserve"
		>
			<p data-testid="page-label">Page 2</p>
			<div id="preserved-widget" data-wp-preserve>
				<p data-testid="original-content">New server content</p>
			</div>
			<button data-testid="navigate" data-wp-on--click="actions.navigate">
				Navigate
			</button>
		</div>`;

store( 'directive-preserve', {
	actions: {
		*navigate() {
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			return actions.navigate( window.location, {
				force: true,
				html,
			} );
		},
	},
} );
