/**
 * External dependencies
 */
import { uniqueId, take } from 'lodash';

export const fauxEntitySuggestions = [
	{
		id: uniqueId(),
		title: 'Hello Page',
		type: 'page',
		info: '2 days ago',
		url: `?p=${ uniqueId() }`,
	},
	{
		id: uniqueId(),
		title: 'Hello Post',
		type: 'post',
		info: '19 days ago',
		url: `?p=${ uniqueId() }`,
	},
	{
		id: uniqueId(),
		title: 'Hello Another One',
		type: 'page',
		info: '19 days ago',
		url: `?p=${ uniqueId() }`,
	},
	{
		id: uniqueId(),
		title:
			'This is another Post with a much longer title just to be really annoying and to try and break the UI',
		type: 'post',
		info: '1 month ago',
		url: `?p=${ uniqueId() }`,
	},
];

/* eslint-disable no-unused-vars */
export const fetchFauxEntitySuggestions = (
	val = '',
	{ isInitialSuggestions } = {}
) => {
	const suggestions = isInitialSuggestions
		? take( fauxEntitySuggestions, 3 )
		: fauxEntitySuggestions;
	return Promise.resolve( suggestions );
};
/* eslint-enable no-unused-vars */
