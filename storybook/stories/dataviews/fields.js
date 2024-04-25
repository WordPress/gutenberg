/**
 * WordPress dependencies
 */
import { dateI18n } from '@wordpress/date';

/**
 * Internal dependencies
 */
import { ROLES, POST_STATUSES } from './constants';

const fields = [
	{
		id: 'featured-image',
		header: 'Featured Image',
		render: ( { item } ) => {
			if ( ! item.mediaUrl ) {
				return null;
			}
			return (
				<img
					src={ item.mediaUrl }
					alt=""
					style={ { maxWidth: '100%' } }
				/>
			);
		},
		enableSorting: false,
	},
	{
		id: 'title',
		header: 'Title',
		enableHiding: false,
		enableGlobalSearch: true,
	},
	{
		id: 'date',
		header: 'Date',
		render: ( { item } ) => {
			return dateI18n( 'Y-m-d H:i', item.date );
		},
	},
	{
		id: 'author',
		header: 'Author',
		render: ( { item } ) => {
			return (
				ROLES.find( ( { value } ) => value === item.author )?.label ??
				item.author
			);
		},
		getValue: ( { item } ) => {
			return (
				ROLES.find( ( { value } ) => value === item.author )?.value ??
				item.author
			);
		},
		elements: ROLES.map( ( { value, label } ) => ( {
			value,
			label,
		} ) ),
		filterBy: {
			operators: [ 'is', 'isNot' ],
		},
		enableSorting: false,
	},
	{
		id: 'status',
		header: 'Status',
		render: ( { item } ) => {
			return (
				POST_STATUSES.find( ( { value } ) => value === item.status )
					?.label ?? item.status
			);
		},
		getValue: ( { item } ) => {
			return (
				POST_STATUSES.find( ( { value } ) => value === item.status )
					?.value ?? item.status
			);
		},
		elements: POST_STATUSES,
		filterBy: {
			operators: [ 'isAny' ],
		},
		enableSorting: false,
	},
];

export default fields;
