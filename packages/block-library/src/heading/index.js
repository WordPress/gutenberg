/**
 * WordPress dependencies
 */
import { heading as icon } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import {
	privateApis as blocksPrivateApis,
	getBlockType,
	unregisterBlockVariation,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';
import variations from './variations';
import { unlock } from '../lock-unlock';

const { fieldsKey, formKey } = unlock( blocksPrivateApis );

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			content: __( 'Code is Poetry' ),
			level: 2,
			style: {
				typography: {
					textAlign: 'center',
				},
			},
		},
	},
	__experimentalLabel( attributes, { context } ) {
		const { content, level } = attributes;

		const customName = attributes?.metadata?.name;
		const hasContent = content?.trim().length > 0;

		// In the list view, use the block's content as the label.
		// If the content is empty, fall back to the default label.
		if ( context === 'list-view' && ( customName || hasContent ) ) {
			return customName || content;
		}

		if ( context === 'breadcrumb' && customName ) {
			return customName;
		}

		if ( context === 'accessibility' ) {
			return ! hasContent
				? sprintf(
						/* translators: accessibility text. %s: heading level. */
						__( 'Level %s. Empty.' ),
						level
				  )
				: sprintf(
						/* translators: accessibility text. 1: heading level. 2: heading content. */
						__( 'Level %1$s. %2$s' ),
						level,
						content
				  );
		}
	},
	transforms,
	deprecated,
	merge( attributes, attributesToMerge ) {
		return {
			content:
				( attributes.content || '' ) +
				( attributesToMerge.content || '' ),
		};
	},
	edit,
	save,
	variations,
};

if ( window.__experimentalContentOnlyInspectorFields ) {
	settings[ fieldsKey ] = [
		{
			id: 'content',
			label: __( 'Content' ),
			type: 'text',
			Edit: 'rich-text', // TODO: replace with custom component
		},
	];
	settings[ formKey ] = {
		fields: [ 'content' ],
	};
}

export const init = () => {
	const block = initBlock( { name, metadata, settings } );

	// Unregister heading level variations based on `levelOptions` attribute.
	// This is for backwards compatibility, as extenders can now unregister the
	// variation directly: `wp.blocks.unregisterBlockVariation( 'core/heading', 'h1' )`.
	const levelOptions =
		getBlockType( name )?.attributes?.levelOptions?.default;
	if ( levelOptions ) {
		[ 1, 2, 3, 4, 5, 6 ].forEach( ( level ) => {
			if ( ! levelOptions.includes( level ) ) {
				unregisterBlockVariation( name, `h${ level }` );
			}
		} );
	}

	return block;
};
