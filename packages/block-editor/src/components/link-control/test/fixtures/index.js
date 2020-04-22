/**
 * External dependencies
 */
import { uniqueId, take } from 'lodash';

export const fauxEntitySuggestions = [
	{
		id: uniqueId(),
		title: 'Hello Page',
		type: 'Page',
		info: '2 days ago',
		url: `?p=${ uniqueId() }`,
	},
	{
		id: uniqueId(),
		title: 'Hello Post',
		type: 'Post',
		info: '19 days ago',
		url: `?p=${ uniqueId() }`,
	},
	{
		id: uniqueId(),
		title: 'Hello Another One',
		type: 'Page',
		info: '19 days ago',
		url: `?p=${ uniqueId() }`,
	},
	{
		id: uniqueId(),
		title:
			'This is another Post with a much longer title just to be really annoying and to try and break the UI',
		type: 'Post',
		info: '1 month ago',
		url: `?p=${ uniqueId() }`,
	},
];

/* eslint-disable no-unused-vars */
export const fetchFauxEntitySuggestions = (
	val = '',
	{ perPage = null } = {}
) => {
	const suggestions = perPage
		? take( fauxEntitySuggestions, perPage )
		: fauxEntitySuggestions;
	return Promise.resolve( suggestions );
};
/* eslint-enable no-unused-vars */
