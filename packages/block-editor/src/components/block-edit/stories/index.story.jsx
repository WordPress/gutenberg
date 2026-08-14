import { useState } from '@wordpress/element';
import BlockEdit from '../index';

const meta = {
	title: 'BlockEditor/BlockEdit',
	component: BlockEdit,
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component:
					'Component for editing a block within the block editor.',
			},
		},
	},
	argTypes: {
		name: {
			control: 'text',
			description: 'The name of the block.',
		},
		isSelected: {
			control: 'boolean',
			description: 'Whether the block is selected.',
		},
		clientId: {
			control: 'text',
			description: 'The client ID of the block.',
		},
		attributes: {
			control: 'object',
			description: 'The attributes of the block.',
		},
		__unstableLayoutClassNames: {
			control: 'text',
			description: 'Layout class names for the block.',
		},
		onReplace: {
			action: 'onReplace',
			control: { type: null },
			description: 'Function called when the block is replaced.',
		},
	},
};

export default meta;

export const Default = {
	render: function Template( { onReplace, ...args } ) {
		const [ attributes, setAttributes ] = useState( args.attributes || {} );

		return (
			<BlockEdit
				{ ...args }
				attributes={ attributes }
				onReplace={ ( ...replaceArgs ) => {
					setAttributes( ...replaceArgs );
					onReplace( ...replaceArgs );
				} }
			/>
		);
	},
	args: {
		name: 'core/paragraph',
		isSelected: false,
		clientId: 'example-client-id',
		attributes: {},
		__unstableLayoutClassNames: '',
	},
};
