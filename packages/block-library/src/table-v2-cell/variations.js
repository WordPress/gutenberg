import { __ } from '@wordpress/i18n';
import { header as icon } from '@wordpress/icons';

const variations = [
	{
		name: 'table-header',
		title: __( 'Table header' ),
		description: __( 'A header cell within a table.' ),
		icon,
		attributes: { tag: 'th' },
		scope: [],
		isActive: ( blockAttributes ) => blockAttributes.tag === 'th',
	},
];

export default variations;
