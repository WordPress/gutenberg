/**
 * WordPress dependencies
 */
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import type { CoreDataError, Post } from '../types';

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

export const editPostWithNotices = async < T extends Post >(
	postsWithUpdates: {
		originalPost: T;
		changes: Partial< T >;
	}[],
	notice: NoticeSettings< T >,
	callbacks: {
		onActionPerformed?: ( posts: T[] ) => void;
		onActionError?: () => void;
	}
) => {
	const { createSuccessNotice, createErrorNotice } = dispatch( noticesStore );
	const { editEntityRecord, saveEditedEntityRecord } = dispatch( coreStore );
	await Promise.allSettled(
		postsWithUpdates.map( ( post ) => {
			return editEntityRecord(
				'postType',
				post.originalPost.type,
				post.originalPost.id,
				{
					...post.changes,
				}
			);
		} )
	);
	const allSettledResults = await Promise.allSettled(
		postsWithUpdates.map( ( post ) => {
			return saveEditedEntityRecord(
				'postType',
				post.originalPost.type,
				post.originalPost.id,
				{
					throwOnError: true,
				}
			);
		} )
	);
	// If all the promises were fulfilled with success.
	if ( allSettledResults.every( ( { status } ) => status === 'fulfilled' ) ) {
		let successMessage;
		if ( allSettledResults.length === 1 ) {
			successMessage = notice.success.messages.getMessage(
				postsWithUpdates[ 0 ].originalPost
			);
		} else {
			successMessage = notice.success.messages.getBatchMessage(
				postsWithUpdates.map( ( post ) => post.originalPost )
			);
		}
		createSuccessNotice( successMessage, {
			type: notice.success.type ?? 'snackbar',
			id: notice.success.id,
		} );
		callbacks.onActionPerformed?.(
			postsWithUpdates.map( ( post ) => post.originalPost )
		);
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
