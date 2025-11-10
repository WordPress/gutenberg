/**
 * WordPress dependencies
 */
import { details as icon } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import transforms from './transforms';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			summary: __( 'La Mancha' ),
			showContent: true,
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __(
						'In a village of La Mancha, the name of which I have no desire to call to mind, there lived not long since one of those gentlemen that keep a lance in the lance-rack, an old buckler, a lean hack, and a greyhound for coursing.'
					),
				},
			},
		],
	},
	__experimentalLabel( attributes, { context } ) {
		const { summary } = attributes;

		const customName = attributes?.metadata?.name;
		const hasSummary = summary?.trim().length > 0;

		// In the list view, use the block's summary as the label.
		// If the summary is empty, fall back to the default label.
		if ( context === 'list-view' && ( customName || hasSummary ) ) {
			return customName || summary;
		}

		if ( context === 'accessibility' ) {
			return ! hasSummary
				? __( 'Details. Empty.' )
				: sprintf(
						/* translators: %s: accessibility text; summary title. */
						__( 'Details. %s' ),
						summary
				  );
		}
	},
	save,
	edit,
	transforms,
};

if ( window.__experimentalContentOnlyPatternInsertion ) {
	settings.fields = [
		{
			label: __( 'Summary' ),
			type: 'RichText',
			shownByDefault: true,
			mapping: {
				value: 'summary',
			},
		},
	];
}

export const init = () => initBlock( { name, metadata, settings } );
