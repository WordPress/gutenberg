/**
 * External dependencies
 */
import { uniqueId, take } from 'lodash';

export const fauxEntitySuggestions = [
	{
		id: uniqueId(),
		title: 'Hello Page',
		type: 'post',
		subtype: 'page',
		url: `?p=${ uniqueId() }`,
	},
	{
		id: uniqueId(),
		title: 'Hello Post',
		type: 'post',
		subtype: 'post',
		url: `?p=${ uniqueId() }`,
	},
	{
		id: uniqueId(),
		title: 'Hello Another One',
		type: 'post',
		subtype: 'page',
		url: `?p=${ uniqueId() }`,
	},
	{
		id: uniqueId(),
		title: 'This is another Post with a much longer title just to be really annoying and to try and break the UI',
		type: 'post',
		subtype: 'post',
		info: '1 month ago',
		url: `?p=${ uniqueId() }`,
	},
];

/* eslint-disable no-unused-vars */
export const fetchFauxEntitySuggestions = ( val = '', {
	perPage = null,
} = {} ) => {
	const suggestions = perPage ? take( fauxEntitySuggestions, perPage ) : fauxEntitySuggestions;
	return Promise.resolve( suggestions );
};
/* eslint-enable no-unused-vars */
