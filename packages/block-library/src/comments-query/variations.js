/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postList } from '@wordpress/icons';

const QUERY_DEFAULT_ATTRIBUTES = {
	query: {
		perPage: 3,
		pages: 0,
		offset: 0,
		order: 'desc',
		orderBy: 'date',
	},
};

const variations = [
	{
		name: 'test-1',
		title: __( 'Test 1' ),
		description: __( 'Test' ),
		icon: postList,
		attributes: QUERY_DEFAULT_ATTRIBUTES,
		scope: [ 'inserter' ],
	},
	{
		name: 'test-2',
		title: __( 'Test 2' ),
		icon: postList,
		attributes: { ...QUERY_DEFAULT_ATTRIBUTES, perPage: 1 },
		innerBlocks: [ [ 'core/comments-template', {}, [] ] ],
		scope: [ 'block' ],
	},
	{
		name: 'test-3',
		title: __( 'Test 3' ),
		icon: postList,
		attributes: { ...QUERY_DEFAULT_ATTRIBUTES, perPage: 2 },
		innerBlocks: [ [ 'core/comments-template', {}, [] ] ],
		scope: [ 'block' ],
	},
];

export default variations;
