/**
 * WordPress dependencies
 */
import { heading as icon } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			content: __( 'Code is Poetry' ),
			level: 2,
			textAlign: 'center',
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
};

export const init = () => initBlock( { name, metadata, settings } );
