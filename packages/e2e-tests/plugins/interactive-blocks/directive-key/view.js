/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';
// eslint-disable-next-line no-restricted-syntax
import { navigate } from '@wordpress/interactivity/router';

const html = `
		<div
			data-wp-interactive='{ "namespace": "directive-key" }'
			data-wp-navigation-id="some-id"
		>
			<ul>
				<li data-wp-key="id-1">1</li>
				<li data-wp-key="id-2" data-testid="second-item">2</li>
				<li data-wp-key="id-3">3</li>
			</ul>
		</div>`;

store( 'directive-key', {
	actions: {
		navigate() {
			navigate( window.location, {
				force: true,
				html,
			} );
		},
	},
} );
