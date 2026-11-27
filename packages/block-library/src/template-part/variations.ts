import { store as coreDataStore } from '@wordpress/core-data';
import type { WpTemplatePart } from '@wordpress/core-data';
import type { BlockConfiguration } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { getTemplatePartIcon } from './edit/utils/get-template-part-icon';
import type { TemplatePartAttributes } from './types';

export function enhanceTemplatePartVariations(
	settings: BlockConfiguration< TemplatePartAttributes >,
	name: string
) {
	if ( name !== 'core/template-part' ) {
		return settings;
	}

	if ( settings.variations ) {
		const isActive = (
			blockAttributes: TemplatePartAttributes,
			variationAttributes: TemplatePartAttributes
		) => {
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
			const entity = getEntityRecord< WpTemplatePart >(
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
