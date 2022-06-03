/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TreeSelect from '../';

const meta: ComponentMeta< typeof TreeSelect > = {
	title: 'Components/TreeSelect',
	component: TreeSelect,
	argTypes: {
		tree: { control: { type: null } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};

export default meta;

const TreeSelectWithState: ComponentStory< typeof TreeSelect > = ( props ) => {
	const [ selection, setSelection ] = useState< string >();

	return (
		<TreeSelect
			{ ...props }
			onChange={ setSelection }
			selectedId={ selection }
		/>
	);
};

export const Default = TreeSelectWithState.bind( {} );
Default.args = {
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
