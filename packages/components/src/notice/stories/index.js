/**
 * External dependencies
 */
import { boolean, select, text } from '@storybook/addon-knobs';

/**
 * Internal dependencies
 */
import Notice from '../';

export default {
	title: 'Components/Notice',
	component: Notice,
	parameters: {
		knobs: { disable: false },
	},
};

export const _default = () => {
	const status = select(
		'Status',
		{
			Warning: 'warning',
			Success: 'success',
			Error: 'error',
			Info: 'info',
		},
		'info'
	);
	const isDismissible = boolean( 'Is Dismissible', true );

	return (
		<Notice status={ status } isDismissible={ isDismissible }>
			<p>This is a notice.</p>
		</Notice>
	);
};

export const withCustomSpokenMessage = () => {
	const status = select(
		'Status',
		{
			Warning: 'warning',
			Success: 'success',
			Error: 'error',
			Info: 'info',
		},
		'info'
	);
	const isDismissible = boolean( 'Is Dismissible', true );
	const politeness = select(
		'Politeness',
		{
			Assertive: 'assertive',
			Polite: 'polite',
		},
		'assertive'
	);
	const spokenMessage = text(
		'Spoken Message',
		'This is a notice with a custom spoken message'
	);

	return (
		<Notice
			status={ status }
			isDismissible={ isDismissible }
			politeness={ politeness }
			spokenMessage={ spokenMessage }
		>
			<p>This is a notice.</p>
		</Notice>
	);
};
