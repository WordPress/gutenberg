import { __ } from '@wordpress/i18n';
import { Popover, Button } from '@wordpress/components';
import { closeSmall } from '@wordpress/icons';
import {
	privateApis as coreDataPrivateApis,
	type PostEditorAwarenessState,
} from '@wordpress/core-data';
import { speak } from '@wordpress/a11y';
import Avatar from './avatar';
import { getAvatarUrl } from '../collaborators-overlay/get-avatar-url';
import { getAvatarBorderColor } from '../collab-sidebar/utils';
import { type CursorRegistry } from '../collaborators-overlay/cursor-registry';
import { getNearestVisibleBlockAncestor } from '../collaborators-overlay/cursor-dom-utils';
import { resolvePrimaryPosition } from '../collaborators-overlay/resolve-primary-position';
import { unlock } from '../../lock-unlock';

const { useResolvedSelection } = unlock( coreDataPrivateApis );

/**
 * Prepares the editor for navigating to a collaborator's location, without
 * disturbing the local user's own selection.
 *
 * Blurs whatever the local user currently has focused, so their own caret
 * visually pauses (stops blinking) instead of looking "active" somewhere
 * they're not currently looking — the same way Google Docs handles jumping
 * to a collaborator. Nothing about the local user's actual position ever
 * changes: this only blurs, it never dispatches a block-editor selection
 * action, so clicking back into their own text re-focuses it exactly where
 * they left off, like any ordinary click.
 *
 * Then, if `targetElement` is a native `<details>` element, opens it
 * directly via the DOM. `<details>` is natively "uncontrolled" — once
 * opened, it stays open independent of React re-renders, until something
 * changes it again — so this reveal never depends on, or disturbs,
 * block-editor selection either. Blocks not built on `<details>` (e.g.
 * core/accordion-item, whose open state is derived live from selection with
 * no persistent state of its own) aren't opened this way: revealing their
 * content would require touching selection, undoing the guarantee above.
 *
 * @param targetElement  - The element to reveal (a block, or its nearest visible ancestor).
 * @param editorDocument - The editor iframe's document, or null.
 */
export function revealTargetForNavigation(
	targetElement: HTMLElement,
	editorDocument: Document | null
): void {
	// targetElement and editorDocument.activeElement come from the editor
	// canvas iframe — a different JS realm than this code runs in (this
	// component renders outside the canvas iframe). `instanceof` compares
	// against *this* realm's constructors, so `x instanceof HTMLElement`
	// silently returns false for every element from the iframe, no matter
	// what it actually is — instanceof is not safe across window/iframe
	// boundaries. Duck-type instead.
	const activeElement = editorDocument?.activeElement as
		| HTMLElement
		| null
		| undefined;
	if ( activeElement && typeof activeElement.blur === 'function' ) {
		activeElement.blur();
	}

	if ( targetElement.tagName === 'DETAILS' ) {
		const details = targetElement as HTMLDetailsElement;
		if ( ! details.open ) {
			details.open = true;
		}
	}
}

interface CollaboratorsListProps {
	activeCollaborators: PostEditorAwarenessState[];
	popoverAnchor?: HTMLElement | null;
	setIsPopoverVisible: ( isVisible: boolean ) => void;
	cursorRegistry: CursorRegistry;
	postId: number | null;
	postType: string | null;
}

/**
 * Renders a list showing all active collaborators with their details.
 * When the showCollaborationCursor preference is enabled, the current user
 * is included and expected to be first in the list.
 * @param props                     Component props
 * @param props.activeCollaborators List of active collaborators
 * @param props.popoverAnchor       Anchor element for the popover
 * @param props.setIsPopoverVisible Callback to set the visibility of the popover
 * @param props.cursorRegistry      Shared registry for scroll-to-cursor support
 * @param props.postId              ID of the post
 * @param props.postType            Type of the post
 */
export function CollaboratorsList( {
	activeCollaborators,
	popoverAnchor,
	setIsPopoverVisible,
	cursorRegistry,
	postId,
	postType,
}: CollaboratorsListProps ) {
	const resolveSelection = useResolvedSelection( postId, postType );

	const handleCollaboratorClick = (
		collaboratorState: PostEditorAwarenessState
	) => {
		const resolved = resolvePrimaryPosition(
			collaboratorState.editorState?.selection,
			resolveSelection
		);

		// Resolve the collaborator's actual block directly from the editor
		// document, rather than looking it up via the registry's clientId
		// map — that map points at the awareness-cursor overlay node, which
		// isn't relevant here since this action never touches block
		// selection (see below).
		const editorDocument = cursorRegistry.getEditorDocument();
		const blockElement =
			resolved?.localClientId && editorDocument
				? editorDocument.querySelector< HTMLElement >(
						`[data-block="${ resolved.localClientId }"]`
				  )
				: null;
		// Walks up to a visible ancestor when the block is itself hidden
		// (e.g. inside a collapsed core/details); returns the block
		// unchanged when it's already visible.
		const targetElement = blockElement
			? getNearestVisibleBlockAncestor( blockElement )
			: null;

		let success = false;
		if ( targetElement ) {
			revealTargetForNavigation( targetElement, editorDocument );

			cursorRegistry.scrollToElement( targetElement, {
				behavior: 'smooth',
				block: 'center',
			} );

			// Best-effort: flashes the collaborator's avatar/cursor overlay
			// node if one is currently registered. Scrolling uses the
			// stable block element above instead of this registry lookup,
			// since the block never disappears mid-navigation, but the
			// avatar node itself is still the right thing to flash for
			// visual feedback. Revealing hidden content can cause the
			// overlay to swap this collaborator's registered node shortly
			// after (e.g. a "hidden proxy" avatar replaced by a real cursor
			// once their content becomes visible) — registerCursor() in
			// cursor-registry.ts carries an in-progress highlight over to
			// the replacement automatically, so this call doesn't need to
			// account for that itself.
			cursorRegistry.highlightCursor( collaboratorState.clientId, 2000 );
			success = true;
		} else {
			// Fall back to the registry lookup — covers cases where the
			// selection couldn't be resolved to a block (e.g. a stale Yjs
			// position), so there's nothing to reveal, but a cursor may
			// still be registered from a prior render.
			success = cursorRegistry.scrollToCursor(
				collaboratorState.clientId,
				{
					behavior: 'smooth',
					block: 'center',
					highlightDuration: 2000,
				}
			);
		}

		if ( success ) {
			speak( __( 'Scrolled to cursor' ), 'polite' );
		}

		setIsPopoverVisible( false );
	};

	return (
		<Popover
			anchor={ popoverAnchor }
			placement="bottom"
			offset={ 8 }
			className="editor-collaborators-presence__list"
			onClose={ () => setIsPopoverVisible( false ) }
		>
			<div className="editor-collaborators-presence__list-content">
				<div className="editor-collaborators-presence__list-header">
					<div className="editor-collaborators-presence__list-header-title">
						{ __( 'Collaborators' ) }
						<span>{ activeCollaborators.length }</span>
					</div>
					<div className="editor-collaborators-presence__list-header-action">
						<Button
							__next40pxDefaultSize
							icon={ closeSmall }
							iconSize={ 24 }
							label={ __( 'Close Collaborators List' ) }
							onClick={ () => setIsPopoverVisible( false ) }
						/>
					</div>
				</div>
				<div className="editor-collaborators-presence__list-items">
					{ activeCollaborators.map( ( collaboratorState ) => {
						const isCurrentUser = collaboratorState.isMe;
						return (
							<button
								key={ collaboratorState.clientId }
								className="editor-collaborators-presence__list-item"
								disabled={ isCurrentUser }
								onClick={ () =>
									handleCollaboratorClick( collaboratorState )
								}
							>
								<Avatar
									src={ getAvatarUrl(
										collaboratorState.collaboratorInfo
											.avatar_urls
									) }
									name={
										collaboratorState.collaboratorInfo.name
									}
									borderColor={
										isCurrentUser
											? 'var(--wp-admin-theme-color)'
											: getAvatarBorderColor(
													collaboratorState
														.collaboratorInfo.id
											  )
									}
									dimmed={ ! collaboratorState.isConnected }
								/>
								<div className="editor-collaborators-presence__list-item-info">
									<div className="editor-collaborators-presence__list-item-name">
										{ isCurrentUser
											? __( 'You' )
											: collaboratorState.collaboratorInfo
													.name }
									</div>
								</div>
							</button>
						);
					} ) }
				</div>
			</div>
		</Popover>
	);
}
