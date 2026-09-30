import { useDispatch, useSelect } from '@wordpress/data';
import { STORE_NAME } from '../store/constants';
import { settleRequest } from '../store/requests';
import type { PostPickerPost, PostPickerRequest } from '../store/types';
import PostPickerModal from './post-picker-modal';

/**
 * Renders the modal for the current `pickPosts` request.
 *
 * The store is referenced by name rather than by its descriptor to avoid an
 * import cycle, since the store's actions mount this component.
 */
export default function PostPickerHost() {
	const request: PostPickerRequest | null = useSelect(
		( select ) => ( select( STORE_NAME ) as any ).getPostPickerRequest(),
		[]
	);
	const { closePostPicker } = useDispatch( STORE_NAME ) as any;

	if ( ! request ) {
		return null;
	}

	return (
		<PostPickerModal
			// A new request starts with fresh search, paging and selection.
			key={ request.id }
			{ ...request.config }
			onSelect={ ( posts: PostPickerPost[] ) => {
				settleRequest( request.id, posts );
				closePostPicker();
			} }
			onClose={ closePostPicker }
		/>
	);
}
