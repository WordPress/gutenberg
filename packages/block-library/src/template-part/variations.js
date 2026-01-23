/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getTemplatePartIcon } from './edit/utils/get-template-part-icon';

export function enhanceTemplatePartVariations( settings, name ) {
	if ( name !== 'core/template-part' ) {
		return settings;
	}

	if ( settings.variations ) {
		const isActive = ( blockAttributes, variationAttributes ) => {
			const { area, theme, slug } = blockAttributes;
			// We first check the `area` block attribute which is set during insertion.
			// This property is removed on the creation of a template part.
			if ( area ) {
				return area === variationAttributes.area;
			}
			// Find a matching variation from the created template part
			// by checking the entity's `area` property.
			if ( ! slug ) {
				return false;
			}
			const { getCurrentTheme, getEntityRecord } =
				select( coreDataStore );
			const entity = getEntityRecord(
				'postType',
				'wp_template_part',
				`${ theme || getCurrentTheme()?.stylesheet }//${ slug }`
			);

			if ( entity?.slug ) {
				return entity.slug === variationAttributes.slug;
			}
			return entity?.area === variationAttributes.area;
		};

		const variations = settings.variations.map( ( variation ) => {
			return {
				...variation,
				...( ! variation.isActive && { isActive } ),
				...( typeof variation.icon === 'string' && {
					icon: getTemplatePartIcon( variation.icon ),
				} ),
			};
		} );

		return {
			...settings,
			variations,
		};
	}
	return settings;
}
