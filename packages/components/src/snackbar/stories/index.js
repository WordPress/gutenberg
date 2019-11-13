/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Snackbar from '../';

export default { title: 'Components|Snackbar', component: Snackbar };

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
	const actions = [ { label: text( 'Label', 'Open WP.org' ), url: text( 'URL', 'https://wordpress.org' ) } ];

	return (
		<Snackbar actions={ actions }>
			{ content }
		</Snackbar>
	);
};
