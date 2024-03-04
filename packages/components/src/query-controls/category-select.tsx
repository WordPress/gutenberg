/**
 * Internal dependencies
 */
import { buildTermsTree } from './terms';
import TreeSelect from '../tree-select';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import type { CategorySelectProps } from './types';

export default function CategorySelect( {
	__next40pxDefaultSize,
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
				onChange: onChangeProp,
			} }
			tree={ termsTree }
			selectedId={
				selectedCategoryId !== undefined
					? String( selectedCategoryId )
					: undefined
			}
			{ ...props }
			__nextHasNoMarginBottom
			__next40pxDefaultSize={ __next40pxDefaultSize }
		/>
	);
}
