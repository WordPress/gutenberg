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
import { useDeprecated36pxDefaultSizeProp } from '../utils/use-deprecated-props';
import { ContextSystemProvider } from '../context';
import { maybeWarnDeprecated36pxSize } from '../utils/deprecated-36px-size';

const CONTEXT_VALUE = {
	BaseControl: {
		// Temporary during deprecation grace period: Overrides the underlying `__associatedWPComponentName`
		// via the context system to override the value set by SelectControl.
		_overrides: { __associatedWPComponentName: 'TreeSelect' },
	},
};

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
 * 			__nextHasNoMarginBottom
 * 			__next40pxDefaultSize
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
		label,
		noOptionLabel,
		onChange,
		selectedId,
		tree = [],
		...restProps
	} = useDeprecated36pxDefaultSizeProp( props );

	const options = useMemo( () => {
		return [
			noOptionLabel && { value: '', label: noOptionLabel },
			...getSelectOptions( tree ),
		].filter( < T, >( option: T ): option is Truthy< T > => !! option );
	}, [ noOptionLabel, tree ] );

	maybeWarnDeprecated36pxSize( {
		componentName: 'TreeSelect',
		size: restProps.size,
		__next40pxDefaultSize: restProps.__next40pxDefaultSize,
	} );

	return (
		<ContextSystemProvider value={ CONTEXT_VALUE }>
			<SelectControl
				__shouldNotWarnDeprecated36pxSize
				{ ...{ label, options, onChange } }
				value={ selectedId }
				{ ...restProps }
			/>
		</ContextSystemProvider>
	);
}

export default TreeSelect;
