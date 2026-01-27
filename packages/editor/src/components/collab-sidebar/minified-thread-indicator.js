/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { dateI18n, getDate } from '@wordpress/date';

/**
 * Internal dependencies
 */
import { getAvatarBorderColor, getCommentExcerpt } from './utils';

/**
 * A compact avatar indicator for a note thread.
 * Shows a single avatar that expands on hover to show author details.
 *
 * @param {Object}   props           Component props.
 * @param {Object}   props.thread    The thread data.
 * @param {number}   props.y         The vertical position from floating-ui.
 * @param {Object}   props.refs      The refs object from floating-ui.
 * @param {Function} props.onExpand  Callback when indicator is clicked/activated.
 * @param {Function} props.onKeyDown Callback for keyboard navigation.
 */
export default function MinifiedThreadIndicator( {
	thread,
	y,
	refs,
	onExpand,
	onKeyDown,
} ) {
	const [ isHovered, setIsHovered ] = useState( false );

	const currentUserId = useSelect( ( select ) => {
		return select( coreStore ).getCurrentUser()?.id;
	}, [] );

	// Get the last comment (most recent reply, or the thread itself if no replies).
	const lastComment = useMemo( () => {
		const replies = thread?.reply || [];
		if ( replies.length > 0 ) {
			return replies[ replies.length - 1 ];
		}
		return thread;
	}, [ thread ] );

	const commentExcerpt = getCommentExcerpt(
		stripHTML( thread.content?.rendered ),
		10
	);

	// Show unread indicator if last comment is from another user.
	const hasUnread =
		currentUserId && lastComment?.author !== currentUserId;

	// Format the time for display (e.g., "12:42 PM").
	const formattedTime = lastComment?.date
		? dateI18n( 'g:i A', getDate( lastComment.date ) )
		: '';

	const handleClick = ( event ) => {
		event.stopPropagation();
		onExpand();
	};

	const handleKeyDown = ( event ) => {
		if ( event.key === 'Enter' || event.key === ' ' ) {
			event.preventDefault();
			onExpand();
		} else if ( onKeyDown ) {
			// Handle arrow key navigation.
			onKeyDown( event );
		}
	};

	if ( ! lastComment?.author_avatar_urls ) {
		return null;
	}

	return (
		<div
			className={ `editor-collab-sidebar-panel__minified-indicator${
				isHovered ? ' is-expanded' : ''
			}` }
			id={ `comment-thread-${ thread.id }` }
			onClick={ handleClick }
			onKeyDown={ handleKeyDown }
			onMouseEnter={ () => setIsHovered( true ) }
			onMouseLeave={ () => setIsHovered( false ) }
			onFocus={ () => setIsHovered( true ) }
			onBlur={ () => setIsHovered( false ) }
			tabIndex={ 0 }
			role="treeitem"
			aria-label={ sprintf(
				// translators: %s: note excerpt
				__( 'Note: %s' ),
				commentExcerpt
			) }
			aria-expanded={ isHovered }
			ref={ refs?.setFloating }
			style={ { top: y } }
		>
			<img
				src={ lastComment?.author_avatar_urls?.[ 48 ] }
				alt={ lastComment?.author_name }
				className="editor-collab-sidebar-panel__minified-avatar"
				style={ {
					borderColor: getAvatarBorderColor( lastComment?.author ),
				} }
			/>
			{ isHovered && (
				<>
					<span className="editor-collab-sidebar-panel__minified-author-name">
						{ lastComment?.author_name }
					</span>
					<span className="editor-collab-sidebar-panel__minified-time">
						{ formattedTime }
					</span>
				</>
			) }
			{ hasUnread && (
				<span className="editor-collab-sidebar-panel__minified-unread-dot" />
			) }
		</div>
	);
}
