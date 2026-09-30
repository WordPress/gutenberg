import type { DataRegistry } from '@wordpress/data';
import { mountPostPicker } from '../mount';
import { createRequest, settleRequest } from './requests';
import type { PostPickerConfig, PostPickerRequest } from './types';

type ThunkArgs = {
	select: { getPostPickerRequest: () => PostPickerRequest | null };
	dispatch: ( action: { type: string; [ key: string ]: unknown } ) => void;
	registry: DataRegistry;
};

/**
 * Opens the post picker and resolves with the selected posts, or with `null`
 * if the picker is dismissed. Opening the picker while it is already open
 * resolves the earlier request with `null`.
 *
 * The picker renders itself into the document the first time it is opened,
 * so callers do not need to render anything.
 *
 * @example
 * ```js
 * import { store as postPickerStore } from '@wordpress/post-picker';
 * import { dispatch } from '@wordpress/data';
 *
 * const posts = await dispatch( postPickerStore ).pickPosts( {
 * 	postType: 'page',
 * 	title: __( 'Choose parent page' ),
 * } );
 * ```
 *
 * @param config Picker options.
 * @return Promise that resolves with the selected posts, or `null`.
 */
export const pickPosts =
	( config: PostPickerConfig ) =>
	( { select, dispatch, registry }: ThunkArgs ) => {
		const current = select.getPostPickerRequest();
		if ( current ) {
			settleRequest( current.id, null );
		}

		mountPostPicker( registry );

		const { id, promise } = createRequest();
		dispatch( { type: 'OPEN_POST_PICKER', request: { id, config } } );
		return promise;
	};

/**
 * Closes the post picker. The open request, if any, resolves with `null`.
 */
export const closePostPicker =
	() =>
	( { select, dispatch }: ThunkArgs ) => {
		const current = select.getPostPickerRequest();
		if ( current ) {
			settleRequest( current.id, null );
		}
		dispatch( { type: 'CLOSE_POST_PICKER' } );
	};
