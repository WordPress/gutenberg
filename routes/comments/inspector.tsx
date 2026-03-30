/**
 * WordPress dependencies
 */
import { useSearch, useNavigate } from '@wordpress/route';
import { useMemo, useEffect, useCallback } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import {
	check,
	cancelCircleFilled,
	bug,
	trash,
	backup,
	chevronUp,
	chevronDown,
	closeSmall,
} from '@wordpress/icons';
import {
	Button,
	Tooltip,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { CommentWithPermissions } from './types';
import { COMMENT_STATUSES } from './types';

const STATUS_LABELS: Record< string, string > = {
	[ COMMENT_STATUSES.APPROVE ]: __( 'Approved' ),
	[ COMMENT_STATUSES.HOLD ]: __( 'Pending' ),
	[ COMMENT_STATUSES.SPAM ]: __( 'Spam' ),
	[ COMMENT_STATUSES.TRASH ]: __( 'Trash' ),
};

/**
 * Navigate to a specific comment by updating URL search params.
 *
 * @param commentId    The comment ID to select.
 * @param searchParams Current search params object.
 * @param navigate     The navigate function from the router.
 */
function selectComment(
	commentId: string,
	searchParams: Record< string, unknown >,
	navigate: ReturnType< typeof useNavigate >
) {
	navigate( {
		search: {
			...searchParams,
			commentIds: [ commentId ],
		},
	} );
}

/**
 * Clear the comment selection.
 *
 * @param searchParams Current search params object.
 * @param navigate     The navigate function from the router.
 */
function clearSelection(
	searchParams: Record< string, unknown >,
	navigate: ReturnType< typeof useNavigate >
) {
	navigate( {
		search: {
			...searchParams,
			commentIds: undefined,
		},
	} );
}

function CommentInspector() {
	const searchParams = useSearch( { from: '/$status' } );
	const navigate = useNavigate();

	const commentIds = useMemo(
		() => searchParams.commentIds ?? [],
		[ searchParams.commentIds ]
	);

	const visibleIds: string[] = useMemo(
		() => searchParams.visibleIds ?? [],
		[ searchParams.visibleIds ]
	);

	const currentId = commentIds.length === 1 ? commentIds[ 0 ] : null;

	// Determine prev/next comment IDs based on the visible list order.
	const { prevId, nextId } = useMemo( () => {
		if ( ! currentId || visibleIds.length === 0 ) {
			return { prevId: null, nextId: null };
		}
		const idx = visibleIds.indexOf( currentId );
		if ( idx === -1 ) {
			return { prevId: null, nextId: null };
		}
		return {
			prevId: idx > 0 ? visibleIds[ idx - 1 ] : null,
			nextId: idx < visibleIds.length - 1 ? visibleIds[ idx + 1 ] : null,
		};
	}, [ currentId, visibleIds ] );

	const { comment, postTitle } = useSelect(
		( select ) => {
			if ( ! currentId ) {
				return { comment: null, postTitle: null };
			}
			const commentRecord = select( coreStore ).getEntityRecord(
				'root',
				'comment',
				Number( currentId )
			) as CommentWithPermissions | undefined;

			let resolvedPostTitle = null;
			if ( commentRecord?.post ) {
				const post = select( coreStore ).getEntityRecord(
					'postType',
					'post',
					commentRecord.post,
					{ _fields: 'title' }
				);
				resolvedPostTitle = (
					post as { title?: { rendered?: string } }
				 )?.title?.rendered;
			}

			return { comment: commentRecord, postTitle: resolvedPostTitle };
		},
		[ currentId ]
	);

	const { editEntityRecord, saveEditedEntityRecord, deleteEntityRecord } =
		useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	/**
	 * Auto-advance to the next (or previous) comment after an action.
	 * If no comments remain, clear the selection.
	 */
	const autoAdvance = useCallback( () => {
		if ( nextId ) {
			selectComment( nextId, searchParams, navigate );
		} else if ( prevId ) {
			selectComment( prevId, searchParams, navigate );
		} else {
			clearSelection( searchParams, navigate );
		}
	}, [ nextId, prevId, searchParams, navigate ] );

	/**
	 * Change the comment status and auto-advance.
	 *
	 * @param newStatus The new status to set on the comment.
	 * @param label     Human-readable label for the notice message.
	 */
	const changeStatus = useCallback(
		async ( newStatus: string, label: string ) => {
			if ( ! currentId ) {
				return;
			}
			try {
				await editEntityRecord(
					'root',
					'comment',
					Number( currentId ),
					{ status: newStatus }
				);
				await saveEditedEntityRecord(
					'root',
					'comment',
					Number( currentId ),
					{ throwOnError: true }
				);
				createSuccessNotice( label, {
					type: 'snackbar',
				} );
				autoAdvance();
			} catch {
				createErrorNotice(
					__( 'An error occurred. Please try again.' ),
					{ type: 'snackbar' }
				);
			}
		},
		[
			currentId,
			editEntityRecord,
			saveEditedEntityRecord,
			createSuccessNotice,
			createErrorNotice,
			autoAdvance,
		]
	);

	/**
	 * Move comment to trash and auto-advance.
	 */
	const handleTrash = useCallback( async () => {
		if ( ! currentId ) {
			return;
		}
		try {
			await deleteEntityRecord(
				'root',
				'comment',
				Number( currentId ),
				{},
				{ throwOnError: true }
			);
			createSuccessNotice( __( 'Comment moved to trash.' ), {
				type: 'snackbar',
			} );
			autoAdvance();
		} catch {
			createErrorNotice(
				__( 'An error occurred while moving to trash.' ),
				{ type: 'snackbar' }
			);
		}
	}, [
		currentId,
		deleteEntityRecord,
		createSuccessNotice,
		createErrorNotice,
		autoAdvance,
	] );

	const handleApprove = useCallback(
		() => changeStatus( 'approve', __( 'Comment approved.' ) ),
		[ changeStatus ]
	);

	const handleUnapprove = useCallback(
		() => changeStatus( 'hold', __( 'Comment unapproved.' ) ),
		[ changeStatus ]
	);

	const handleSpam = useCallback(
		() => changeStatus( 'spam', __( 'Comment marked as spam.' ) ),
		[ changeStatus ]
	);

	const handleRestore = useCallback(
		() => changeStatus( 'approve', __( 'Comment restored.' ) ),
		[ changeStatus ]
	);

	const goToPrevious = useCallback( () => {
		if ( prevId ) {
			selectComment( prevId, searchParams, navigate );
		}
	}, [ prevId, searchParams, navigate ] );

	const goToNext = useCallback( () => {
		if ( nextId ) {
			selectComment( nextId, searchParams, navigate );
		}
	}, [ nextId, searchParams, navigate ] );

	const handleClose = useCallback( () => {
		clearSelection( searchParams, navigate );
	}, [ searchParams, navigate ] );

	// Keyboard navigation
	useEffect( () => {
		if ( ! currentId ) {
			return;
		}

		/**
		 * Handle keydown events for comment navigation.
		 *
		 * @param event The keyboard event.
		 */
		function onKeyDown( event: KeyboardEvent ) {
			// Do not intercept when focus is inside an input or textarea.
			const tag = ( event.target as HTMLElement )?.tagName;
			if ( tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ) {
				return;
			}

			switch ( event.key ) {
				case 'ArrowUp':
					event.preventDefault();
					if ( prevId ) {
						selectComment( prevId, searchParams, navigate );
					}
					break;
				case 'ArrowDown':
					event.preventDefault();
					if ( nextId ) {
						selectComment( nextId, searchParams, navigate );
					}
					break;
				case 'Escape':
					event.preventDefault();
					clearSelection( searchParams, navigate );
					break;
			}
		}

		window.addEventListener( 'keydown', onKeyDown );
		return () => {
			window.removeEventListener( 'keydown', onKeyDown );
		};
	}, [ currentId, prevId, nextId, searchParams, navigate ] );

	if ( ! comment ) {
		return (
			<VStack spacing="4" className="comments-inspector">
				<Text>
					{ commentIds.length === 0
						? __( 'Select a comment to view details.' )
						: __( 'Select a single comment to view details.' ) }
				</Text>
			</VStack>
		);
	}

	const dateFormat = getSettings().formats.datetime;
	const commentDate = getDate( comment.date );
	const avatarUrl =
		comment.author_avatar_urls?.[ '96' ] ||
		comment.author_avatar_urls?.[ '48' ];

	const status = comment.status;
	const canUpdate = comment.permissions?.update;
	const canDelete = comment.permissions?.delete;

	// Determine which action buttons to show based on comment status.
	const isApproved = status === COMMENT_STATUSES.APPROVE;
	const isPending = status === COMMENT_STATUSES.HOLD;
	const isSpam = status === COMMENT_STATUSES.SPAM;
	const isTrashed = status === COMMENT_STATUSES.TRASH;

	// Position indicator (e.g., "3 of 12")
	const currentIndex = visibleIds.indexOf( currentId ?? '' );
	const positionLabel =
		currentIndex !== -1 && visibleIds.length > 0
			? `${ currentIndex + 1 } / ${ visibleIds.length }`
			: '';

	return (
		<div className="comments-inspector">
			{ /* Header: actions + navigation */ }
			<div className="comments-inspector__header">
				<div className="comments-inspector__actions">
					{ /* Approve button: show for pending, spam, trash */ }
					{ ( isPending || isSpam || isTrashed ) && canUpdate && (
						<Tooltip
							text={
								isSpam || isTrashed
									? __( 'Restore' )
									: __( 'Approve' )
							}
						>
							<Button
								icon={ isSpam || isTrashed ? backup : check }
								label={
									isSpam || isTrashed
										? __( 'Restore' )
										: __( 'Approve' )
								}
								onClick={
									isSpam || isTrashed
										? handleRestore
										: handleApprove
								}
								size="compact"
							/>
						</Tooltip>
					) }
					{ /* Unapprove button: show for approved comments */ }
					{ isApproved && canUpdate && (
						<Tooltip text={ __( 'Unapprove' ) }>
							<Button
								icon={ cancelCircleFilled }
								label={ __( 'Unapprove' ) }
								onClick={ handleUnapprove }
								size="compact"
							/>
						</Tooltip>
					) }
					{ /* Spam button: show for non-spam, non-trash */ }
					{ ! isSpam && ! isTrashed && canUpdate && (
						<Tooltip text={ __( 'Mark as Spam' ) }>
							<Button
								icon={ bug }
								label={ __( 'Mark as Spam' ) }
								onClick={ handleSpam }
								size="compact"
							/>
						</Tooltip>
					) }
					{ /* Trash button: show for non-trash */ }
					{ ! isTrashed && canDelete && (
						<Tooltip text={ __( 'Move to Trash' ) }>
							<Button
								icon={ trash }
								label={ __( 'Move to Trash' ) }
								onClick={ handleTrash }
								size="compact"
								isDestructive
							/>
						</Tooltip>
					) }
				</div>

				<div className="comments-inspector__navigation">
					{ positionLabel && (
						<Text variant="muted" size="small">
							{ positionLabel }
						</Text>
					) }
					<Tooltip text={ __( 'Previous comment' ) }>
						<Button
							icon={ chevronUp }
							label={ __( 'Previous comment' ) }
							onClick={ goToPrevious }
							disabled={ ! prevId }
							size="compact"
							accessibleWhenDisabled
						/>
					</Tooltip>
					<Tooltip text={ __( 'Next comment' ) }>
						<Button
							icon={ chevronDown }
							label={ __( 'Next comment' ) }
							onClick={ goToNext }
							disabled={ ! nextId }
							size="compact"
							accessibleWhenDisabled
						/>
					</Tooltip>
					<Tooltip text={ __( 'Close' ) }>
						<Button
							icon={ closeSmall }
							label={ __( 'Close' ) }
							onClick={ handleClose }
							size="compact"
						/>
					</Tooltip>
				</div>
			</div>

			{ /* Body */ }
			<div className="comments-inspector__body">
				<VStack spacing="4">
					{ /* Author section */ }
					<HStack alignment="top" spacing="3">
						{ avatarUrl && (
							<img
								src={ avatarUrl }
								alt=""
								width={ 48 }
								height={ 48 }
								style={ {
									borderRadius: '50%',
									flexShrink: 0,
								} }
							/>
						) }
						<VStack spacing="1">
							<Heading level={ 4 }>
								{ comment.author_name || __( 'Anonymous' ) }
							</Heading>
							{ comment.author_email && (
								<Text variant="muted">
									{ comment.author_email }
								</Text>
							) }
							{ comment.author_url && (
								<Text variant="muted">
									{ comment.author_url }
								</Text>
							) }
						</VStack>
					</HStack>

					{ /* Status badge */ }
					<HStack>
						<Text weight="bold">{ __( 'Status:' ) }</Text>
						<Text>
							{ STATUS_LABELS[ comment.status ] ||
								comment.status }
						</Text>
					</HStack>

					{ /* Date */ }
					<HStack>
						<Text weight="bold">{ __( 'Date:' ) }</Text>
						<Text>
							<time dateTime={ comment.date }>
								{ dateI18n( dateFormat, commentDate ) }
							</time>
						</Text>
					</HStack>

					{ /* Post reference */ }
					<HStack>
						<Text weight="bold">{ __( 'In Response To:' ) }</Text>
						<Text>{ postTitle || `Post #${ comment.post }` }</Text>
					</HStack>

					{ /* Comment content */ }
					<VStack spacing="2">
						<Heading level={ 5 }>{ __( 'Comment' ) }</Heading>
						<div
							className="comments-inspector__content-rendered"
							dangerouslySetInnerHTML={ {
								__html: comment.content?.rendered || '',
							} }
						/>
					</VStack>

					{ /* View comment link */ }
					{ comment.link && (
						<a
							href={ comment.link }
							target="_blank"
							rel="noopener noreferrer"
						>
							{ __( 'View Comment' ) }
						</a>
					) }

					{ /* Author IP (for moderation context) */ }
					{ comment.author_ip && (
						<HStack>
							<Text weight="bold">{ __( 'IP Address:' ) }</Text>
							<Text variant="muted">{ comment.author_ip }</Text>
						</HStack>
					) }
				</VStack>
			</div>
		</div>
	);
}

export const inspector = CommentInspector;
