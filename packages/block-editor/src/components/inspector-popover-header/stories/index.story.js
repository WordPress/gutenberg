/**
 * WordPress dependencies
 */
import { Dropdown, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import InspectorPopoverHeader from '../';

const meta = {
	title: 'BlockEditor/InspectorPopoverHeader',
	component: InspectorPopoverHeader,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Renders a header that is suitable for use in an inspector sidebar popover.',
			},
		},
	},
	argTypes: {
		title: {
			control: { type: 'string' },
			description: 'Title to display in the header.',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
		actions: {
			control: { type: null },
			table: {
				type: { summary: 'array' },
			},
			description:
				'Array of actions to display in the header as a row of buttons.',
		},
		onClose: {
			control: { type: null },
			description:
				'Function called when the user presses the close button.',
			table: {
				type: {
					summary: 'function',
				},
			},
		},
		help: {
			control: { type: 'string' },
			description: 'Help text to display at the bottom of the header..',
			table: {
				type: {
					summary: 'string',
				},
			},
		},
	},
};

export default meta;

const Template = ( args ) => {
	return (
		<Dropdown
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button onClick={ onToggle } aria-expanded={ isOpen }>
					Select post date
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<>
					<InspectorPopoverHeader
						title={ args.title }
						actions={ args.actions }
						onClose={ onClose }
					/>
					Place form for editing post date here.
				</>
			) }
		/>
	);
};

export const Default = {
	render: Template,
	args: {
		title: 'Post date',
		actions: [
			{
				label: 'Reset ',
				onClick: () => {},
			},
		],
	},
};
