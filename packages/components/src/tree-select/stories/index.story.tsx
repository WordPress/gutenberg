import type { Meta, StoryFn } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import TreeSelect from '../';

const meta: Meta< typeof TreeSelect > = {
	tags: [ 'manifest' ],
	title: 'Components/Selection & Input/Common/TreeSelect',
	id: 'components-treeselect',
	component: TreeSelect,
	argTypes: {
		help: { control: { type: 'text' } },
		label: { control: { type: 'text' } },
		prefix: { control: { type: 'text' } },
		suffix: { control: { type: 'text' } },
		selectedId: { control: false },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};

export default meta;

const TreeSelectWithState: StoryFn< typeof TreeSelect > = ( props ) => {
	const [ selectedId, setSelectedId ] = useState< string >();
	const [ selectedIds, setSelectedIds ] = useState< string[] >();

	if ( props.multiple ) {
		return (
			<TreeSelect
				{ ...props }
				multiple
				onChange={ setSelectedIds }
				selectedId={ selectedIds }
			/>
		);
	}

	return (
		<TreeSelect
			{ ...props }
			onChange={ setSelectedId }
			selectedId={ selectedId }
		/>
	);
};

export const Default = TreeSelectWithState.bind( {} );
Default.args = {
	label: 'Label Text',
	noOptionLabel: 'No parent page',
	help: 'Help text to explain the select control.',
	tree: [
		{
			name: 'Page 1',
			id: 'p1',
			children: [
				{ name: 'Descend 1 of page 1', id: 'p11' },
				{ name: 'Descend 2 of page 1', id: 'p12' },
			],
		},
		{
			name: 'Page 2',
			id: 'p2',
			children: [
				{
					name: 'Descend 1 of page 2',
					id: 'p21',
					children: [
						{
							name: 'Descend 1 of Descend 1 of page 2',
							id: 'p211',
						},
					],
				},
			],
		},
	],
};

/**
 * Native multi-select is a listbox. Hold Shift or Ctrl (Command on macOS) to select more than one option.
 */
export const Multiple = TreeSelectWithState.bind( {} );
Multiple.args = {
	...Default.args,
	multiple: true,
};
