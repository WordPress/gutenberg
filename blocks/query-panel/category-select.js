/**
 * External dependencies
 */
import { get } from 'lodash';
import { stringify } from 'querystringify';

/**
 * WordPress dependencies
 */
import { buildTermsTree } from '@wordpress/utils';
import { TreeSelect, withAPIData } from '@wordpress/components';

function CategorySelect( { label, noOptionLabel, categories, selectedCategory, onChange } ) {
	const termsTree = buildTermsTree( get( categories, 'data', {} ) );
	return (
		<TreeSelect
			{ ...{ label, noOptionLabel, onChange } }
			tree={ termsTree }
			selectedId={ selectedCategory }
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
