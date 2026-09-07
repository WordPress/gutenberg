import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';

export const descriptionField = {
	label: __( 'Description' ),
	id: 'description',
	render: ( { item }: { item: any } ) => {
		return item.description && decodeEntities( item.description );
	},
	enableSorting: false,
	enableGlobalSearch: true,
};
