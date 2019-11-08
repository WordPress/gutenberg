/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Snackbar from '../';

export default { title: 'Snackbar', component: Snackbar };

export const _default = () => {
	const content = text( 'Content', 'Use Snackbars to communicate low priority, non-interruptive messages to the user.' );

	return (
		<Snackbar>
			{ content }
		</Snackbar>
	);
};

export const withActions = () => {
	const content = text( 'Content', 'Use Snackbars with an action link to an external page.' );
	const actions = [ { url: text( 'URL', 'https://wordpress.org' ), label: text( 'label', 'Open WP.org' ) } ];

	return (
		<Snackbar actions={ actions }>
			{ content }
		</Snackbar>
	);
};
