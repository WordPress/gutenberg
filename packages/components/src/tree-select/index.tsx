/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { SelectControl } from '../select-control';
import type { TreeSelectProps, Tree, Truthy } from './types';

function getSelectOptions(
	tree: Tree[],
	level = 0
): NonNullable< TreeSelectProps[ 'options' ] > {
	return tree.flatMap( ( treeNode ) => [
		{
			value: treeNode.id,
			label:
				'\u00A0'.repeat( level * 3 ) + decodeEntities( treeNode.name ),
		},
		...getSelectOptions( treeNode.children || [], level + 1 ),
	] );
}

/**
 * Generates a hierarchical select input.
 *
 * ```jsx
 * import { useState } from 'react';
 * import { TreeSelect } from '@wordpress/components';
 *
 * const MyTreeSelect = () => {
 * 	const [ page, setPage ] = useState( 'p21' );
 *
 * 	return (
 * 		<TreeSelect
 * 			label="Parent page"
 * 			noOptionLabel="No parent page"
 * 			onChange={ ( newPage ) => setPage( newPage ) }
 * 			selectedId={ page }
 * 			tree={ [
 * 				{
 * 					name: 'Page 1',
 * 					id: 'p1',
 * 					children: [
 * 						{ name: 'Descend 1 of page 1', id: 'p11' },
 * 						{ name: 'Descend 2 of page 1', id: 'p12' },
 * 					],
 * 				},
 * 				{
 * 					name: 'Page 2',
 * 					id: 'p2',
 * 					children: [
 * 						{
 * 							name: 'Descend 1 of page 2',
 * 							id: 'p21',
 * 							children: [
 * 								{
 * 									name: 'Descend 1 of Descend 1 of page 2',
 * 									id: 'p211',
 * 								},
 * 							],
 * 						},
 * 					],
 * 				},
 * 			] }
 * 		/>
 * 	);
 * }
 * ```
 */
export function TreeSelect( props: TreeSelectProps ) {
	const {
		// Prevent passing legacy props to internal component.
		__nextHasNoMarginBottom: _,
		__next40pxDefaultSize: _next40pxDefaultSize,
		label,
		noOptionLabel,
		onChange,
		selectedId,
		tree = [],
		...restProps
	} = props;

	const options = useMemo( () => {
		return [
			noOptionLabel && { value: '', label: noOptionLabel },
			...getSelectOptions( tree ),
		].filter( < T, >( option: T ): option is Truthy< T > => !! option );
	}, [ noOptionLabel, tree ] );

	return (
		<SelectControl
			__next40pxDefaultSize
			__shouldNotWarnDeprecated36pxSize
			{ ...{ label, options, onChange } }
			value={ selectedId }
			{ ...restProps }
		/>
	);
}

export default TreeSelect;
