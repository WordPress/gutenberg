/**
 * WordPress dependencies
 */
import { footer, header } from '@wordpress/icons';
import { store as coreDataStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const createIsActiveBasedOnArea = ( area ) => ( { theme, slug } ) => {
	if ( ! slug ) {
		return false;
	}

	const entity = select( coreDataStore ).getEntityRecord(
		'postType',
		'wp_template_part',
		`${ theme }//${ slug }`
	);

	return entity?.area === area;
};

const variations = [
	{
		name: 'header',
		title: __( 'Header' ),
		description:
			"The header template defines a page area that typically contains a title, logo, and main navigation. Since it's a global element it can be present across all pages and posts.",
		icon: header,
		isActive: createIsActiveBasedOnArea( 'header' ),
		scope: [],
	},
	{
		name: 'footer',
		title: __( 'Footer' ),
		description:
			"The footer template defines a page area that typically contains site credits, social links, or any other combination of blocks. Since it's a global element it can be present across all pages and posts.",
		icon: footer,
		isActive: createIsActiveBasedOnArea( 'footer' ),
		scope: [],
	},
];

export default variations;
