/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { select } from '@wordpress/data';
import { paragraph as icon } from '@wordpress/icons';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';
import { unlock } from '../lock-unlock';

const { fieldsKey, formKey } = unlock( blocksPrivateApis );

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			content: __(
				'In a village of La Mancha, the name of which I have no desire to call to mind, there lived not long since one of those gentlemen that keep a lance in the lance-rack, an old buckler, a lean hack, and a greyhound for coursing.'
			),
		},
	},
	__experimentalLabel( attributes, { context } ) {
		const { content } = attributes;
		const customName = attributes?.metadata?.name;
		const hasContent = content?.trim().length > 0;

		if ( context === 'breadcrumb' && customName ) {
			return customName;
		}

		if ( context === 'list-view' ) {
			if ( customName ) {
				return customName;
			}

			if ( hasContent ) {
				const autoLabelContentBlocks = select( preferencesStore ).get(
					'core',
					'autoLabelContentBlocks',
					true
				);
				if ( autoLabelContentBlocks ) {
					return content;
				}
			}
		}

		if ( context === 'accessibility' ) {
			if ( customName ) {
				return customName;
			}

			return ! content || content?.length === 0 ? __( 'Empty' ) : content;
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

export const init = () => initBlock( { name, metadata, settings } );
