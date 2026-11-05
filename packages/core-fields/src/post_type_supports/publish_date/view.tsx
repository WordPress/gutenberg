import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import type { PostWithDate } from '../date/types';
import { isDateFloating } from '../date/is-date-floating';
import DateView from '../date/view';

interface PostWithDateAndId extends PostWithDate {
	id?: number;
	type?: string;
}

/*
 * The publish date of a post: "Immediately" while the post has no date of its
 * own, the date worded after its status otherwise.
 */
export default function PublishDateView( {
	item,
}: {
	item: PostWithDateAndId;
} ) {
	// The saved status, not the edited one: a status picked in the same form
	// doesn't change whether the date floats until the post is saved.
	const savedStatus = useSelect(
		( select ) => {
			if ( ! item.type || ! item.id ) {
				return undefined;
			}
			const saved: { status?: string } | undefined = select(
				coreStore
			).getEntityRecord( 'postType', item.type, item.id );
			return saved?.status;
		},
		[ item.type, item.id ]
	);

	// A reset date (`null`) takes the date of the save, whatever the status.
	if (
		! item.date ||
		isDateFloating( { ...item, status: savedStatus ?? item.status } )
	) {
		return <>{ __( 'Immediately' ) }</>;
	}

	return <DateView item={ item } />;
}
