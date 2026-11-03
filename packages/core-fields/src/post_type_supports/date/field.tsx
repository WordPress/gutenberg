import { resolveSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { getDate } from '@wordpress/date';
import type { FieldsScriptParts } from '../../types';
import { hasActionLink } from '../../shared/has-action-link';
import type { PostWithDate } from './types';
import DateView from './view';

/**
 * The JavaScript parts of the date field; its data is in `field.php`.
 */
export const fieldExtensions: FieldsScriptParts< PostWithDate >[ string ] = {
	// Only the users who can publish the post see the control.
	isVisible: ( item ) => hasActionLink( item, 'wp:action-publish' ),
	render: DateView,
	Edit: {
		control: 'datetime',
		// Mark the days that already have published or scheduled posts of
		// the same type, to help pick a free day.
		getEvents: async ( { item, from, to } ) => {
			// A filter or a bulk edit form has no post type.
			if ( ! item?.type ) {
				return [];
			}
			const posts =
				( await resolveSelect( coreDataStore ).getEntityRecords<
					Required< Pick< PostWithDate, 'id' | 'date' > >
				>( 'postType', item.type, {
					status: 'publish,future',
					after: from.toISOString(),
					before: to.toISOString(),
					exclude: item.id ? [ item.id ] : undefined,
					per_page: 100,
					_fields: 'id,date',
				} ) ) ?? [];
			// `date` is in the site time zone.
			return posts.map( ( { date } ) => ( { date: getDate( date ) } ) );
		},
	},
};
