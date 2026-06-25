import { useResizeObserver, useMergeRefs } from '@wordpress/compose';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import Avatar from '../collaborators-presence/avatar';
import { AVATAR_IFRAME_STYLES } from './avatar-iframe-styles';
import { OVERLAY_IFRAME_STYLES } from './overlay-iframe-styles';
import { setDelayedInterval } from './timing-utils';
import { useBlockHighlighting } from './use-block-highlighting';
import { useRenderCursors } from './use-render-cursors';
import { type CursorRegistry } from './cursor-registry';

// Milliseconds to wait after a change before recomputing cursor positions.
const RERENDER_DELAY_MS = 500;

// Periodically recompute cursor positions to account for DOM layout
// changes that don't trigger awareness state updates (e.g. a collaborator
// applying formatting shifts text but the cursor's logical position is
// unchanged). Only active when remote cursors are visible.
const CURSOR_REDRAW_INTERVAL_MS = 10_000;

interface OverlayProps {
	blockEditorDocument?: Document;
	postId: number | null;
	postType: string | null;
	cursorRegistry?: CursorRegistry;
}

/**
 * This component is responsible for rendering the overlay components within the editor iframe.
 *
 * @param props                     - The overlay props.
 * @param props.blockEditorDocument - The block editor document.
 * @param props.postId              - The ID of the post.
 * @param props.postType            - The type of the post.
 * @param props.cursorRegistry      - The shared cursor registry.
 * @return The Overlay component.
 */
export function Overlay( {
	blockEditorDocument,
	postId,
	postType,
	cursorRegistry,
}: OverlayProps ) {
	// Use state for the overlay element so that the hook re-runs once the ref is attached.
	const [ overlayElement, setOverlayElement ] =
		useState< HTMLDivElement | null >( null );

	const { cursors, rerenderCursorsAfterDelay } = useRenderCursors(
		overlayElement,
		blockEditorDocument ?? null,
		postId ?? null,
		postType ?? null,
		RERENDER_DELAY_MS
	);

	const { highlights, rerenderHighlightsAfterDelay } = useBlockHighlighting(
		overlayElement,
		blockEditorDocument ?? null,
		postId ?? null,
		postType ?? null,
		RERENDER_DELAY_MS
	);

	// Detect layout changes on overlay (e.g. turning on "Show Template") and window
	// resizes, and re-render the cursors and block highlights.
	const onResize = useCallback( () => {
		rerenderCursorsAfterDelay();
		rerenderHighlightsAfterDelay();
	}, [ rerenderCursorsAfterDelay, rerenderHighlightsAfterDelay ] );
	const resizeObserverRef = useResizeObserver( onResize );

	// Trigger the initial position computation on mount.
	useEffect( () => {
		const cleanupCursors = rerenderCursorsAfterDelay();
		const cleanupHighlights = rerenderHighlightsAfterDelay();
		return () => {
			cleanupCursors();
			cleanupHighlights();
		};
	}, [ rerenderCursorsAfterDelay, rerenderHighlightsAfterDelay ] );

	useEffect( () => {
		if ( cursors.length === 0 ) {
			return;
		}

		return setDelayedInterval(
			rerenderCursorsAfterDelay,
			CURSOR_REDRAW_INTERVAL_MS
		);
	}, [ cursors.length, rerenderCursorsAfterDelay ] );

	// Merge the refs to use the same element for both overlay and resize observation
	const mergedRef = useMergeRefs< HTMLDivElement | null >( [
		setOverlayElement,
		resizeObserverRef,
	] );

	// Track cursor element refs for registry registration.
	const cursorRefsMap = useRef< Map< number, HTMLElement > >( new Map() );

	// Keep the registry in sync whenever the rendered cursors change.
	useEffect( () => {
		if ( ! cursorRegistry ) {
			return;
		}
		const refs = cursorRefsMap.current;
		const currentIds = new Set( cursors.map( ( c ) => c.clientId ) );

		// Unregister cursors that are no longer rendered.
		for ( const id of refs.keys() ) {
			if ( ! currentIds.has( id ) ) {
				cursorRegistry.unregisterCursor( id );
				refs.delete( id );
			}
		}

		// Register or update cursors that are currently rendered.
		for ( const [ id, el ] of refs.entries() ) {
			cursorRegistry.registerCursor( id, el );
		}

		return () => cursorRegistry.removeAll();
	}, [ cursors, cursorRegistry ] );

	// Callback ref factory to capture each cursor's DOM element.
	const setCursorRef = useCallback(
		( clientId: number ) => ( el: HTMLDivElement | null ) => {
			if ( el ) {
				cursorRefsMap.current.set( clientId, el );
			} else {
				cursorRefsMap.current.delete( clientId );
			}
		},
		[]
	);

	// This is a full overlay that covers the entire iframe document. Good for
	// scrollable elements like cursor indicators.
	return (
		<div className="collaborators-overlay-full" ref={ mergedRef }>
			<style>{ AVATAR_IFRAME_STYLES + OVERLAY_IFRAME_STYLES }</style>
			{ cursors.map( ( cursor ) => (
				<div key={ cursor.clientId }>
					{ ! cursor.isMe &&
						cursor.selectionRects?.map( ( rect, index ) => (
							<div
								key={ `${ cursor.clientId }-sel-${ index }` }
								className="collaborators-overlay-selection-rect"
								style={ {
									left: `${ rect.x }px`,
									top: `${ rect.y }px`,
									width: `${ rect.width }px`,
									height: `${ rect.height }px`,
									backgroundColor: cursor.color,
								} }
							/>
						) ) }
					<div
						ref={ setCursorRef( cursor.clientId ) }
						className="collaborators-overlay-user"
						style={ {
							left: `${ cursor.x }px`,
							top: `${ cursor.y }px`,
						} }
					>
						{ ! cursor.isMe && (
							<div
								className="collaborators-overlay-user-cursor"
								style={ {
									backgroundColor: cursor.color,
									height: `${ cursor.height }px`,
								} }
							/>
						) }
						<Avatar
							className="collaborators-overlay-user-label"
							variant="badge"
							size="small"
							src={ cursor.avatarUrl }
							name={ cursor.userName }
							label={ cursor.isMe ? __( 'You' ) : undefined }
							borderColor={ cursor.color }
						/>
					</div>
				</div>
			) ) }
			{ highlights.map( ( highlight ) => (
				<Avatar
					key={ highlight.blockId }
					className="collaborators-overlay-block-label"
					variant="badge"
					size="small"
					src={ highlight.avatarUrl }
					name={ highlight.userName }
					borderColor={ highlight.color }
					style={ {
						left: `${ highlight.x }px`,
						top: `${ highlight.y }px`,
					} }
				/>
			) ) }
		</div>
	);
}
