import { __ } from '@wordpress/i18n';
import { header as icon } from '@wordpress/icons';

const variations = [
	{
		name: 'table-header',
		title: __( 'Table Heading' ),
		description: __( 'A heading cell within a table.' ),
		icon,
		attributes: { tag: 'th' },
		scope: [],
		isActive: ( blockAttributes ) => blockAttributes.tag === 'th',
	},
];

export default variations;
