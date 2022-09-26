/**
 * Internal dependencies
 */
import { buildTermsTree } from './terms';
import TreeSelect from '../tree-select';
/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

export default function CategorySelect( {
	label,
	noOptionLabel,
	categoriesList,
	selectedCategoryId,
	onChange,
	...props
} ) {
	const termsTree = useMemo( () => {
		return buildTermsTree( categoriesList );
	}, [ categoriesList ] );

	return (
		<TreeSelect
			{ ...{ label, noOptionLabel, onChange } }
			tree={ termsTree }
			selectedId={ selectedCategoryId }
			{ ...props }
		/>
	);
}
