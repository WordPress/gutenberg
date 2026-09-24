import { __ } from '@wordpress/i18n';
import { button as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			className: 'is-style-fill',
			text: __( 'Call to action' ),
		},
	},
	edit,
	save,
	deprecated,
	merge: ( a, { text = '' } ) => ( {
		...a,
		text: ( a.text || '' ) + text,
	} ),
	__experimentalLabel( attributes, { context } ) {
		const { text } = attributes;

		const customName = attributes?.metadata?.name;
		const hasContent = text?.trim().length > 0;

		// In the list view, use the block's text as the label.
		// If the text is empty, fall back to the default label.
		if ( context === 'list-view' && ( customName || hasContent ) ) {
			return customName || text;
		}

		if ( context === 'breadcrumb' && customName ) {
			return customName;
		}
	},
};

export const init = () => initBlock( { name, metadata, settings } );
