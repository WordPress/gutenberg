/**
 * WordPress dependencies
 */
import { footer, header } from '@wordpress/icons';
import { store as coreDataStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const variations = [
	{
		name: 'header',
		title: __( 'Header' ),
		description: __(
			"The header template defines a page area that typically contains a title, logo, and main navigation. Since it's a global element it can be present across all pages and posts."
		),
		icon: header,
		attributes: { area: 'header' },
		scope: [ 'inserter' ],
	},
	{
		name: 'footer',
		title: __( 'Footer' ),
		description: __(
			"The footer template defines a page area that typically contains site credits, social links, or any other combination of blocks. Since it's a global element it can be present across all pages and posts."
		),
		icon: footer,
		attributes: { area: 'footer' },
		scope: [ 'inserter' ],
	},
];

/**
 * Add `isActive` function to all `Template Part` variations, if not defined.
 * `isActive` function is used to find a variation match from a created
 *  Block by providing its attributes.
 */
variations.forEach( ( variation ) => {
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

export default variations;
