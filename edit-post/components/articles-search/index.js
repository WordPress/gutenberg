/**
 * External dependencies
 */
import { get, isUndefined, pickBy } from 'lodash';
import { stringify } from 'querystringify';

/**
 * WordPress dependencies
 */
import { ArticlesList, withAPIData } from '@wordpress/components';

function ArticlesSearch( { articlesList } ) {
	return ( <ArticlesList articles={ get( articlesList, 'data', {} ) } /> );
}

export default withAPIData( ( props ) => {
	const options = {
		category_id: props.options.categoryId || '',
		s: props.options.term || '',
		order: props.options.order || 'desc',
		orderBy: props.options.orderBy || 'date',
	};

	const articlesListQuery = stringify( pickBy( options, value => ! isUndefined( value ) ) );

	return {
		articlesList: `/wp/v2/articles?${ articlesListQuery }`,
	};
} )( ArticlesSearch );
