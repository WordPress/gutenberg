/**
 * WordPress dependencies
 */
import { footer, header, sidebar } from '@wordpress/icons';
import { store as coreDataStore } from '@wordpress/core-data';
import { select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

const createIsActive = ( area ) => ( { theme, slug } ) => {
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
		icon: header,
		isActive: createIsActive( 'header' ),
		scope: [],
	},
	{
		name: 'sidebar',
		title: __( 'Sidebar' ),
		icon: sidebar,
		isActive: createIsActive( 'sidebar' ),
		scope: [],
	},
	{
		name: 'footer',
		title: __( 'Footer' ),
		icon: footer,
		isActive: createIsActive( 'footer' ),
		scope: [],
	},
];

export default variations;
