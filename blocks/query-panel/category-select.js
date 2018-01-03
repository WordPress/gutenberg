/**
 * External dependencies
 */
import { get } from 'lodash';
import { stringify } from 'querystringify';

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

const applyWithAPIData = withAPIData( () => {
	const query = stringify( {
		per_page: 100,
		_fields: [ 'id', 'name', 'parent' ],
	} );
	return {
		categories: `/wp/v2/categories?${ query }`,
	};
} );

export default applyWithAPIData( CategorySelect );
