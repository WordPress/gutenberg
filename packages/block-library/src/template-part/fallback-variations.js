/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { header as headerIcon, footer as footerIcon } from '@wordpress/icons';
import { store as coreDataStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';

const fallbackVariations = [
	{
		name: 'header',
		icon: headerIcon,
		title: __( 'Header' ),
		description: __(
			'The Header template defines a page area that typically contains a title, logo, and main navigation.'
		),
		attributes: { area: 'header' },
		scope: [ 'inserter' ],
	},
	{
		name: 'footer',
		icon: footerIcon,
		title: __( 'Footer' ),
		description: __(
			'The Footer template defines a page area that typically contains site credits, social links, or any other combination of blocks.'
		),
		attributes: { area: 'footer' },
		scope: [ 'inserter' ],
	},
];

fallbackVariations.forEach( ( variation ) => {
	if ( variation.isActive ) return;
	variation.isActive = ( blockAttributes, variationAttributes ) => {
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
} );

export default fallbackVariations;
