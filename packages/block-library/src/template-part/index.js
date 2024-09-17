/**
 * External dependencies
 */
import { capitalCase } from 'change-case';

/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
import { symbolFilled } from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import { enhanceTemplatePartVariations } from './variations';

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon: symbolFilled,
	__experimentalLabel: ( { slug, theme } ) => {
		// Attempt to find entity title if block is a template part.
		// Require slug to request, otherwise entity is uncreated and will throw 404.
		if ( ! slug ) {
			return;
		}

		const { getCurrentTheme, getEditedEntityRecord } =
			select( coreDataStore );
		const entity = getEditedEntityRecord(
			'postType',
			'wp_template_part',
			( theme || getCurrentTheme()?.stylesheet ) + '//' + slug
		);
		if ( ! entity ) {
			return;
		}

		return (
			decodeEntities( entity.title ) || capitalCase( entity.slug || '' )
		);
	},
	edit,
};

export const init = () => {
	addFilter(
		'blocks.registerBlockType',
		'core/template-part',
		enhanceTemplatePartVariations
	);

	// Prevent adding template parts inside post templates.
	const DISALLOWED_PARENTS = [ 'core/post-template', 'core/post-content' ];
	addFilter(
		'blockEditor.__unstableCanInsertBlockType',
		'core/block-library/removeTemplatePartsFromPostTemplates',
		(
			canInsert,
			blockType,
			rootClientId,
			{ getBlock, getBlockParentsByBlockName }
		) => {
			if ( blockType.name !== 'core/template-part' ) {
				return canInsert;
			}

			for ( const disallowedParentType of DISALLOWED_PARENTS ) {
				const hasDisallowedParent =
					getBlock( rootClientId )?.name === disallowedParentType ||
					getBlockParentsByBlockName(
						rootClientId,
						disallowedParentType
					).length;
				if ( hasDisallowedParent ) {
					return false;
				}
			}
			return true;
		}
	);

	return initBlock( { name, metadata, settings } );
};
