/**
 * External dependencies
 */
import { boolean, object, text } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TreeSelect from '../';

export default {
	title: 'Components/TreeSelect',
	component: TreeSelect,
	parameters: {
		knobs: { disable: false },
	},
};

const TreeSelectWithState = ( props ) => {
	const [ selection, setSelection ] = useState();

	return (
		<TreeSelect
			{ ...props }
			onChange={ setSelection }
			selectedId={ selection }
		/>
	);
};

export const _default = () => {
	const label = text( 'Label', 'Label Text' );
	const noOptionLabel = text( 'No Option Label', 'No parent page' );
	const hideLabelFromVision = boolean( 'Hide Label From Vision', false );
	const help = text(
		'Help Text',
		'Help text to explain the select control.'
	);
	const tree = object( 'Tree', [
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
	] );

	return (
		<TreeSelectWithState
			label={ label }
			noOptionLabel={ noOptionLabel }
			hideLabelFromVision={ hideLabelFromVision }
			help={ help }
			tree={ tree }
		/>
	);
};
