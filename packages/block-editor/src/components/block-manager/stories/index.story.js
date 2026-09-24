/**
 * Internal dependencies
 */
import BlockManager from '..';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

const meta = {
	title: 'BlockEditor/BlockManager',
	component: BlockManager,
	tags: [ 'status-private' ],
	parameters: {
		docs: {
			canvas: {
				sourceState: 'shown',
			},
			description: {
				component:
					'The `BlockManager` component displays a list of blocks with quick navigation.',
			},
		},
	},
	argTypes: {
		blockTypes: {
			control: {
				type: null,
			},
			description: 'An array of blocks.',
			table: {
				type: { summary: 'Array' },
			},
		},
		selectedBlockTypes: {
			control: {
				type: null,
			},
			description: 'An array of selected blocks.',
			table: {
				type: { summary: 'Array' },
			},
		},
		onChange: {
			action: 'onChange',
			control: {
				type: null,
			},
			description:
				'Function to be called when the selected blocks change.',
			table: {
				type: {
					summary: 'Function',
				},
			},
		},
	},
};

export default meta;

export const Default = {
	args: {
		blockTypes: [
			{
				name: 'core/paragraph',
				title: 'Paragraph',
			},
			{
				name: 'core/heading',
				title: 'Heading',
			},
		],
		selectedBlockTypes: [
			{
				name: 'core/heading',
				title: 'Heading',
			},
		],
	},
	render: function Template( { onChange, ...args } ) {
		const [ selectedBlockTypes, setSelectedBlockTypes ] = useState(
			args.selectedBlockTypes
		);
		return (
			<BlockManager
				{ ...args }
				onChange={ ( newSelectedBlockTypes ) => {
					setSelectedBlockTypes( newSelectedBlockTypes );
					onChange( newSelectedBlockTypes );
				} }
				selectedBlockTypes={ selectedBlockTypes }
			/>
		);
	},
};
