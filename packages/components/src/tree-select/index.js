/**
 * External dependencies
 */
import { unescape as unescapeString, repeat, flatMap, compact } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { SelectControl } from '../';

function getSelectOptions( tree, level = 0 ) {
	return flatMap( tree, ( treeNode ) => [
		{
			value: treeNode.id,
			label:
				repeat( '\u00A0', level * 3 ) + unescapeString( treeNode.name ),
		},
		...getSelectOptions( treeNode.children || [], level + 1 ),
	] );
}

export default function TreeSelect( {
	label,
	noOptionLabel,
	onChange,
	selectedId,
	tree,
	...props
} ) {
	const options = useMemo( () => {
		return compact( [
			noOptionLabel && { value: '', label: noOptionLabel },
			...getSelectOptions( tree ),
		] );
	}, [ noOptionLabel, tree ] );

	return (
		<SelectControl
			{ ...{ label, options, onChange } }
			value={ selectedId }
			{ ...props }
		/>
	);
}
