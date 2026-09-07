import { symbol as icon } from '@wordpress/icons';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as patternsStore } from '@wordpress/patterns';
import { select } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { addFilter } from '@wordpress/hooks';
import initBlock from '../utils/init-block';
import { getTemplatePartIcon } from '../template-part/edit/utils/get-template-part-icon';
import { unlock } from '../lock-unlock';
import metadata from './block.json';
import edit from './edit';
import deprecated from './deprecated';

const { name } = metadata;

export { metadata, name };

export const settings = {
	deprecated,
	edit,
	icon,
	__experimentalLabel: ( { ref, slug } ) => {
		if ( ref ) {
			const entity = select( coreStore ).getEditedEntityRecord(
				'postType',
				'wp_block',
				ref
			);
			return entity?.title ? decodeEntities( entity.title ) : undefined;
		}

		if ( slug ) {
			const customization = unlock(
				select( patternsStore )
			).getPatternCustomization( slug );
			if ( customization ) {
				const entity = select( coreStore ).getEditedEntityRecord(
					'postType',
					'wp_block',
					customization.id
				);
				if ( entity?.title ) {
					return decodeEntities( entity.title );
				}
			}
			const pattern = unlock(
				select( blockEditorStore )
			).getPatternBySlug( slug );
			return pattern?.title ? decodeEntities( pattern.title ) : undefined;
		}
	},
};

/**
 * Gives the server-registered area variations an `isActive` matcher and a
 * real icon, so an instance standing in for a header or footer shows that
 * area's icon and title, as template parts do.
 *
 * @param {Object} blockSettings Block settings.
 * @param {string} blockName     Block name.
 * @return {Object} Block settings.
 */
export function enhancePatternAreaVariations( blockSettings, blockName ) {
	if ( blockName !== name || ! blockSettings.variations ) {
		return blockSettings;
	}
	const isActive = ( blockAttributes, variationAttributes ) => {
		const { area, slug } = blockAttributes;
		// The instance's own area wins, else the referenced pattern's. The
		// area is registration data, so read the registry from core-data:
		// this can run while a block editor reducer is executing, when the
		// block editor store must not be read.
		const resolvedArea =
			area ||
			( slug
				? select( coreStore )
						.getBlockPatterns()
						?.find(
							( { name: patternName } ) => patternName === slug
						)?.area
				: undefined );
		return !! resolvedArea && resolvedArea === variationAttributes.area;
	};
	return {
		...blockSettings,
		variations: blockSettings.variations.map( ( variation ) => ( {
			...variation,
			...( ! variation.isActive && { isActive } ),
			...( typeof variation.icon === 'string' && {
				icon: getTemplatePartIcon( variation.icon ),
			} ),
		} ) ),
	};
}

export const init = () => {
	addFilter(
		'blocks.registerBlockType',
		'core/block/area-variations',
		enhancePatternAreaVariations
	);
	return initBlock( { name, metadata, settings } );
};
