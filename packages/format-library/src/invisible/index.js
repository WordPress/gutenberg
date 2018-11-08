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
	getPropsForEditableTreePreparation( select ) {
		return {
			isEnabled: select( 'core/edit-post' ).getActiveGeneralSidebarName() === 'edit-post/block',
		};
	},
	createPrepareEditableTree( props ) {
		return ( formats, text ) => {
			if ( ! props.isEnabled ) {
				return formats;
			}

			const search = 'Gutenberg';
			const index = text.indexOf( search );

			if ( index === -1 ) {
				return formats;
			}

			const start = index;
			const end = index + search.length;

			const newValue = applyFormat( { text, formats }, { type: name }, start, end );

			return newValue.formats;
		};
	},
};
