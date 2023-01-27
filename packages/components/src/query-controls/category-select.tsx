/**
 * Internal dependencies
 */
import { buildTermsTree } from './terms';
import TreeSelect from '../tree-select';
import type { TreeSelectProps } from '../tree-select/types';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import type { CategorySelectProps } from './types';

export default function CategorySelect( {
	label,
	noOptionLabel,
	categoriesList,
	selectedCategoryId,
	onChange: onChangeProp,
	...props
}: CategorySelectProps ) {
	const termsTree = useMemo( () => {
		return buildTermsTree( categoriesList );
	}, [ categoriesList ] );

	return (
		<TreeSelect
			{ ...{
				label,
				noOptionLabel,
				// Since the `multiple` attribute is not passed to `TreeSelect`, it is
				// safe to assume that the argument of `onChange` cannot be `string[]`.
				// The correct solution would be to type `SelectControl` better, so that
				// the type of `value` and `onChange` vary depending on `multiple`.
				onChange: onChangeProp as TreeSelectProps[ 'onChange' ],
			} }
			tree={ termsTree }
			selectedId={
				selectedCategoryId !== undefined
					? String( selectedCategoryId )
					: undefined
			}
			{ ...props }
		/>
	);
}
