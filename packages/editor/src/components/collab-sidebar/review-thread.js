import clsx from 'clsx';
import { useEffect, useRef } from '@wordpress/element';
import { Button, TextareaControl } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import {
	useDebounce,
	__experimentalUseFocusOutside as useFocusOutside,
} from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { Icon, shield } from '@wordpress/icons';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { FloatingContainer } from './floating-container';
import {
	focusNoteThread,
	getNoteExcerpt,
	scrollNoteThreadIntoView,
} from './utils';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { useBlockElement } = unlock( blockEditorPrivateApis );

/*
 * A sidebar card for one sequestered proposal (a `de/pending-review` block).
 *
 * Follows the interaction grammar of `NoteThread`: click or Enter selects the
 * thread and spotlights its block. The body is always fully expanded: an
 * editable raw-markup textarea (writing back to the block's `proposed`
 * attribute, so the in-canvas review surface stays in sync) with Approve /
 * Reject actions. The proposed markup only ever renders as text, mirroring
 * the in-canvas review surface.
 */
export function ReviewThread( {
	review,
	onApprove,
	onReject,
	isSelected,
	sidebarRef,
	floating,
	onKeyDown,
} ) {
	const isFloating = !! floating;
	const {
		toggleBlockHighlight,
		selectBlock,
		toggleBlockSpotlight,
		updateBlockAttributes,
	} = unlock( useDispatch( blockEditorStore ) );
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const { getSelectedNote } = unlock( useSelect( editorStore ) );
	const relatedBlockElement = useBlockElement( review.blockClientId );
	const debouncedToggleBlockHighlight = useDebounce(
		toggleBlockHighlight,
		50
	);
	const floatingRef = useRef( null );
	const isKeyboardTabbingRef = useRef( false );

	const registerThread = floating?.registerThread;
	const unregisterThread = floating?.unregisterThread;

	// Register block + floating elements with the board. Review threads carry
	// no inline marker, so the board anchors them to the block itself.
	useEffect( () => {
		const floatingEl = floatingRef.current;
		if ( floatingEl && registerThread ) {
			registerThread( review.id, relatedBlockElement, floatingEl );
		}
		return () => unregisterThread?.( review.id );
	}, [ relatedBlockElement, review.id, registerThread, unregisterThread ] );

	// Scroll the thread into view when it becomes selected, and re-scroll
	// when its floating position settles after `useFloatingBoard` recomputes.
	useEffect( () => {
		if ( ! isSelected ) {
			return;
		}
		scrollNoteThreadIntoView( review.id, sidebarRef.current );
	}, [ isSelected, floating?.y, review.id, sidebarRef ] );

	function onSelectReview( event ) {
		if ( isSelected ) {
			return;
		}

		selectNote( review.id );
		// Keep focus where the user clicked (e.g. inside the markup
		// textarea); only pull it to the thread for plain card clicks.
		if ( ! event?.target?.closest( 'textarea, button' ) ) {
			focusNoteThread( review.id, sidebarRef.current );
		}
		toggleBlockSpotlight( review.blockClientId, true );
		// Pass `null` as the second parameter to prevent focusing the block.
		selectBlock( review.blockClientId, null );
	}

	function onDeselectReview() {
		selectNote( undefined );
		toggleBlockSpotlight( review.blockClientId, false );
	}

	// Same deferred-deselect dance as `NoteThread`; see the rationale there.
	const focusOutside = useFocusOutside( ( event ) => {
		const isThreadFocused = event.relatedTarget?.closest(
			'.editor-collab-sidebar-panel__thread'
		);
		if ( isThreadFocused && ! isKeyboardTabbingRef.current ) {
			return;
		}

		if ( ! isThreadFocused ) {
			debouncedToggleBlockHighlight.cancel();
			toggleBlockHighlight( review.blockClientId, false );
		}

		if ( getSelectedNote() === review.id ) {
			onDeselectReview();
		}
	} );

	function onMouseEnter() {
		debouncedToggleBlockHighlight( review.blockClientId, true );
	}

	function onMouseLeave() {
		debouncedToggleBlockHighlight( review.blockClientId, false );
	}

	function onFocus( event ) {
		focusOutside.onFocus( event );
		debouncedToggleBlockHighlight.cancel();
		toggleBlockHighlight( review.blockClientId, true );
	}

	/*
	 * The proposal is edited in place, and the review thread object only
	 * refreshes when the block list changes, so the textarea value has to
	 * come straight from the store; this also keeps it in sync with edits
	 * made from the block's in-canvas review surface.
	 */
	const liveProposed = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlockAttributes(
				review.blockClientId
			)?.proposed,
		[ review.blockClientId ]
	);

	/*
	 * Attributes come from parsed post content, which a hand-edited document
	 * can fill with wrongly typed values; only trust strings.
	 */
	const { attributes = {} } = review;
	const proposed = typeof liveProposed === 'string' ? liveProposed : '';
	const proposedHash =
		typeof attributes.proposedHash === 'string'
			? attributes.proposedHash
			: '';
	const placeholder =
		typeof attributes.placeholder === 'string'
			? attributes.placeholder
			: '';

	/*
	 * The placeholder is the filtered (safe) version of the proposal, so its
	 * text content is the closest thing to human-readable context; the raw
	 * proposal would put block delimiters in the label.
	 */
	const placeholderExcerpt = getNoteExcerpt( stripHTML( placeholder ), 10 );
	const ariaLabel = placeholderExcerpt
		? sprintf(
				// translators: %s: excerpt of the content under review.
				__( 'Pending review: %s' ),
				placeholderExcerpt
		  )
		: __( 'Pending review' );

	return (
		<FloatingContainer
			floating={
				isFloating ? { y: floating.y, ref: floatingRef } : undefined
			}
			className={ clsx(
				'editor-collab-sidebar-panel__thread',
				'editor-collab-sidebar-panel__review',
				{
					'is-selected': isSelected,
				}
			) }
			id={ `note-thread-${ review.id }` }
			gap="md"
			onClick={ onSelectReview }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			{ ...focusOutside }
			onFocus={ onFocus }
			onKeyUp={ ( event ) => {
				if ( event.key === 'Tab' ) {
					isKeyboardTabbingRef.current = false;
				}
			} }
			onKeyDown={ ( event ) => {
				if ( event.key === 'Tab' ) {
					isKeyboardTabbingRef.current = true;
				} else {
					onKeyDown( event );
				}
			} }
			tabIndex={ 0 }
			role="treeitem"
			aria-label={ ariaLabel }
		>
			<Stack direction="row" align="center" justify="flex-start" gap="md">
				<span className="editor-collab-sidebar-panel__review-icon">
					<Icon icon={ shield } size={ 24 } />
				</span>
				<Stack direction="column">
					<span className="editor-collab-sidebar-panel__user-name">
						{ __( 'Pending review' ) }
					</span>
					{ !! proposedHash && (
						<span className="editor-collab-sidebar-panel__user-time">
							{ sprintf(
								// translators: %s: shortened content hash identifying the proposal.
								__( 'Proposal %s…' ),
								proposedHash.slice( 0, 8 )
							) }
						</span>
					) }
				</Stack>
			</Stack>
			<TextareaControl
				className="editor-collab-sidebar-panel__review-markup"
				label={ __( 'Proposed markup' ) }
				hideLabelFromVision
				help={ __( 'Approval applies exactly what is shown here.' ) }
				rows={ 6 }
				value={ proposed }
				onChange={ ( value ) =>
					updateBlockAttributes( review.blockClientId, {
						proposed: value,
					} )
				}
			/>
			<Stack direction="row" align="center" justify="flex-start" gap="sm">
				<Button
					variant="primary"
					size="compact"
					onClick={ ( event ) => {
						event.stopPropagation();
						onApprove( review );
					} }
				>
					{ __( 'Approve' ) }
				</Button>
				<Button
					variant="secondary"
					size="compact"
					isDestructive
					onClick={ ( event ) => {
						event.stopPropagation();
						onReject( review );
					} }
				>
					{ __( 'Reject' ) }
				</Button>
			</Stack>
			<Button
				className="editor-collab-sidebar-panel__skip-to-block"
				variant="secondary"
				size="compact"
				onClick={ ( event ) => {
					event.stopPropagation();
					relatedBlockElement?.focus();
				} }
			>
				{ __( 'Back to block' ) }
			</Button>
		</FloatingContainer>
	);
}
