/**
 * External dependencies
 */
import { uniqueId } from 'lodash';

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
		title: 'This is another Post with a much longer title just to be really annoying and to try and break the UI',
		type: 'Post',
		info: '1 month ago',
		url: `?p=${ uniqueId() }`,
	},
];

// export const fetchFauxEntitySuggestions = async () => fauxEntitySuggestions;

export const fetchFauxEntitySuggestions = () => {
	return Promise.resolve( fauxEntitySuggestions );
};
