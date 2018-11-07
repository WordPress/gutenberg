/**
 * WordPress dependencies
 */
import { applyFormat } from '@wordpress/rich-text';

const name = 'core/invisible';

export const invisible = {
	name,
	title: 'invisible',
	tagName: 'mark',
	className: 'invisible',
	prepareEditableTree( formats, text ) {
		const search = 'Gutenberg';
		const index = text.indexOf( search );

		if ( index === -1 ) {
			return formats;
		}

		const start = index;
		const end = index + search.length;

		const newValue = applyFormat( { text, formats }, { type: name }, start, end );

		return newValue.formats;
	},
};
