/**
 * Internal dependencies
 */
import Notice from '../';

// TODO: Add a story involving NoticeList to help people understand
// the difference between onDismiss/onRemove.

export default {
	title: 'Components/Notice',
	component: Notice,
	argTypes: {
		isDismissible: { control: 'boolean' },
		onDismiss: { control: { type: null } },
		onRemove: { control: { type: null } },
		politeness: {
			control: 'radio',
			options: [ 'assertive', 'polite' ],
		},
		spokenMessage: { control: 'text' },
		status: {
			control: 'radio',
			options: [ 'warning', 'success', 'error', 'info' ],
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};

const Template = ( props ) => {
	return <Notice { ...props } />;
};

export const Default = Template.bind( {} );
Default.args = {
	children: 'This is a notice.',
};

export const WithCustomSpokenMessage = Template.bind( {} );
WithCustomSpokenMessage.args = {
	...Default.args,
	politeness: 'assertive',
	spokenMessage: 'This is a notice with a custom spoken message',
};
