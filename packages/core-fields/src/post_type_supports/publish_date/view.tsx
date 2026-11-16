import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import type { PostWithDate } from '../date/types';
import { isDateFloating } from '../date/is-date-floating';
import { getPublishDateLabel } from './get-publish-date-label';

interface PostWithDateAndId extends PostWithDate {
	id?: number;
	type?: string;
}

/*
 * The publish date of a post in words, as the post summary has it: see
 * getPublishDateLabel().
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

	// A bulk edit passes only the edits made so far, so a date it hasn't
	// touched is absent: each post keeps its own, and none reads
	// "Immediately". A reset date is `null`, not absent.
	if ( item.date === undefined ) {
		return null;
	}

	return (
		<>
			{ getPublishDateLabel( item.date, {
				isFloating: isDateFloating( {
					...item,
					status: savedStatus ?? item.status,
				} ),
			} ) }
		</>
	);
}
