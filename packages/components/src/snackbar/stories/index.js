/**
 * External dependencies
 */
import { text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Snackbar from '../';

export default {
	title: 'Components/Snackbar',
	component: Snackbar,
	parameters: {
		knobs: { disable: false },
	},
};

export const _default = () => {
	const content = text(
		'Content',
		'Use Snackbars to communicate low priority, non-interruptive messages to the user.'
	);

	return <Snackbar>{ content }</Snackbar>;
};

export const withActions = () => {
	const content = text(
		'Content',
		'Use Snackbars with an action link to an external page.'
	);
	const actions = [
		{
			label: text( 'Label', 'Open WP.org' ),
			url: text( 'URL', 'https://wordpress.org' ),
		},
	];

	return <Snackbar actions={ actions }>{ content }</Snackbar>;
};

export const withIcon = () => {
	const content = text(
		'Content',
		'Add an icon to make your snackbar stand out'
	);
	const icon = text( 'Icon (as unicode emoji)', '🌮' );

	return (
		<Snackbar
			icon={
				<span role="img" aria-label="Icon" style={ { fontSize: 21 } }>
					{ icon }
				</span>
			}
		>
			{ content }
		</Snackbar>
	);
};

export const withExplicitDismiss = () => {
	const content = text(
		'Content',
		'Add a cross to explicitly close the snackbar, and do not hide it automatically'
	);

	return <Snackbar explicitDismiss={ true }>{ content }</Snackbar>;
};

export const withActionAndExpicitDismiss = () => {
	const content = text(
		'Content',
		'Add an action and a cross to explicitly close the snackbar, and do not hide it automatically'
	);
	const actions = [
		{
			label: text( 'Label', 'Open WP.org' ),
			url: text( 'URL', 'https://wordpress.org' ),
		},
	];

	return (
		<Snackbar actions={ actions } explicitDismiss={ true }>
			{ content }
		</Snackbar>
	);
};
