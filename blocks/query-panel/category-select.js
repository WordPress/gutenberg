/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { buildTermsTree } from '@wordpress/utils';
import { withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import TermTreeSelect from '../term-tree-select';

function CategorySelect( { label, noOptionLabel, categories, selectedCategory, onChange } ) {
	const termsTree = buildTermsTree( get( categories, 'data', {} ) );
	return (
		<TermTreeSelect
			{ ...{ label, noOptionLabel, onChange, termsTree } }
			selectedTerm={ selectedCategory }
		/>
	);
}

const applyWithAPIData = withAPIData( () => ( {
	categories: '/wp/v2/categories',
} ) );

export default applyWithAPIData( CategorySelect );
