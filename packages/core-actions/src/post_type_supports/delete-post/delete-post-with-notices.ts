import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { dispatch } from '@wordpress/data';
import type { CoreDataError, Post } from '../../shared/types';

function getErrorMessagesFromPromises< T >(
	allSettledResults: PromiseSettledResult< T >[]
) {
	const errorMessages = new Set< string >();
	// If there was at lease one failure.
	if ( allSettledResults.length === 1 ) {
		const typedError = allSettledResults[ 0 ] as {
			reason?: CoreDataError;
		};
		if ( typedError.reason?.message ) {
			errorMessages.add( typedError.reason.message );
		}
	} else {
		const failedPromises = allSettledResults.filter(
			( { status } ) => status === 'rejected'
		);
		for ( const failedPromise of failedPromises ) {
			const typedError = failedPromise as {
				reason?: CoreDataError;
			};
			if ( typedError.reason?.message ) {
				errorMessages.add( typedError.reason.message );
			}
		}
	}
	return errorMessages;
}

export type NoticeSettings< T extends Post > = {
	success: {
		id?: string;
		type?: string;
		messages: {
			getMessage: ( posts: T ) => string;
			getBatchMessage: ( posts: T[] ) => string;
		};
	};
	error: {
		id?: string;
		type?: string;
		messages: {
			getMessage: ( errors: Set< string > ) => string;
			getBatchMessage: ( errors: Set< string > ) => string;
		};
	};
};

/**
 * A copy of `deletePostWithNotices()` of `@wordpress/fields`: deletes the
 * posts permanently, then shows a notice with the outcome.
 *
 * @param posts                       The posts to delete.
 * @param notice                      The messages of the notices.
 * @param callbacks                   The callbacks.
 * @param callbacks.onActionPerformed Called once the posts are deleted.
 * @param callbacks.onActionError     Called when a post is not deleted.
 */
export const deletePostWithNotices = async < T extends Post >(
	posts: T[],
	notice: NoticeSettings< T >,
	callbacks: {
		onActionPerformed?: ( posts: T[] ) => void;
		onActionError?: () => void;
	}
) => {
	const { createSuccessNotice, createErrorNotice } = dispatch( noticesStore );
	const { deleteEntityRecord } = dispatch( coreStore );
	const allSettledResults = await Promise.allSettled(
		posts.map( ( post ) => {
			return deleteEntityRecord(
				'postType',
				post.type,
				post.id,
				{ force: true },
				{ throwOnError: true }
			);
		} )
	);
	// If all the promises were fulfilled with success.
	if ( allSettledResults.every( ( { status } ) => status === 'fulfilled' ) ) {
		let successMessage;
		if ( allSettledResults.length === 1 ) {
			successMessage = notice.success.messages.getMessage( posts[ 0 ] );
		} else {
			successMessage = notice.success.messages.getBatchMessage( posts );
		}
		createSuccessNotice( successMessage, {
			type: notice.success.type ?? 'snackbar',
			id: notice.success.id,
		} );
		callbacks.onActionPerformed?.( posts );
	} else {
		const errorMessages = getErrorMessagesFromPromises( allSettledResults );
		let errorMessage = '';
		if ( allSettledResults.length === 1 ) {
			errorMessage = notice.error.messages.getMessage( errorMessages );
		} else {
			errorMessage =
				notice.error.messages.getBatchMessage( errorMessages );
		}

		createErrorNotice( errorMessage, {
			type: notice.error.type ?? 'snackbar',
			id: notice.error.id,
		} );
		callbacks.onActionError?.();
	}
};
