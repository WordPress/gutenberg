/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
import {
	header as headerIcon,
	footer as footerIcon,
	sidebar as sidebarIcon,
	layout as layoutIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import fallbackVariations from './fallback-variations';

function getTemplatePartIcon( iconName ) {
	if ( 'header' === iconName ) {
		return headerIcon;
	} else if ( 'footer' === iconName ) {
		return footerIcon;
	} else if ( 'sidebar' === iconName ) {
		return sidebarIcon;
	}
	return layoutIcon;
}

export function enhanceTemplatePartVariations( settings, name ) {
	if ( name !== 'core/template-part' ) {
		return settings;
	}

	// WordPress versions pre-5.8 do not support server side variation registration.
	// So we must register the fallback variations until those versions are no longer supported.
	if ( ! ( settings.variations && settings.variations.length ) ) {
		return { ...settings, variations: fallbackVariations };
	}

	if ( settings.variations ) {
		const isActive = ( blockAttributes, variationAttributes ) => {
			const { area, theme, slug } = blockAttributes;
			// We first check the `area` block attribute which is set during insertion.
			// This property is removed on the creation of a template part.
			if ( area ) return area === variationAttributes.area;
			// Find a matching variation from the created template part
			// by checking the entity's `area` property.
			if ( ! slug ) return false;
			const entity = select( coreDataStore ).getEntityRecord(
				'postType',
				'wp_template_part',
				`${ theme }//${ slug }`
			);
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
