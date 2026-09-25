import clsx from 'clsx';
import type {
	FocusEvent as ReactFocusEvent,
	KeyboardEvent,
	MouseEvent,
	RefObject,
} from 'react';
import { useEffect, useRef } from '@wordpress/element';
import { Button } from '@wordpress/components';
import {
	useDebounce,
	__experimentalUseFocusOutside as useFocusOutside,
} from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
	// @ts-expect-error - No type declarations available for @wordpress/block-editor
} from '@wordpress/block-editor';
import { FloatingContainer } from './floating-container';
import { scrollNoteThreadIntoView } from './utils';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import {
	BlockReactionsRow,
	useBlockReactionsLabel,
} from './block-reactions-row';
import type { ReactionSummary } from './block-reactions';

const { useBlockElement } = unlock( blockEditorPrivateApis );

export interface BlockReactionsEntryData {
	id: string;
	blockClientId: string;
	reactionsId: string;
	reactions: ReactionSummary;
}

interface FloatingProps {
	y: number;
	registerThread: (
		id: string,
		blockElement: HTMLElement | null,
		floatingElement: HTMLElement
	) => void;
	unregisterThread: ( id: string ) => void;
}

interface BlockReactionsEntryProps {
	entry: BlockReactionsEntryData;
	isSelected: boolean;
	sidebarRef: RefObject< HTMLElement | null >;
	floating?: FloatingProps;
	onKeyDown: ( event: KeyboardEvent< HTMLElement > ) => void;
	onToggleBlockReaction: ( args: {
		clientId: string;
		emoji: string;
	} ) => void;
}

/**
 * The sidebar entry for a block that has reactions but no note of its own.
 *
 * Shares the thread's shell (id, role, selection, floating registration and
 * block highlighting) so keyboard navigation and focus helpers treat it as
 * one more thread in the list.
 *
 * @param props                       Component props.
 * @param props.entry                 The synthetic entry from `useNoteThreads`.
 * @param props.isSelected            Whether the entry is the selected note.
 * @param props.sidebarRef            The sidebar list element.
 * @param props.floating              Floating-board registration, in the
 *                                    floating sidebar.
 * @param props.onKeyDown             List keyboard navigation.
 * @param props.onToggleBlockReaction Adds or removes a reaction on the block.
 */
export function BlockReactionsEntry( {
	entry,
	isSelected,
	sidebarRef,
	floating,
	onKeyDown,
	onToggleBlockReaction,
}: BlockReactionsEntryProps ) {
	const isFloating = !! floating;
	const { toggleBlockHighlight, selectBlock, toggleBlockSpotlight } = unlock(
		useDispatch( blockEditorStore )
	);
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const { getSelectedNote } = unlock( useSelect( editorStore ) );
	const relatedBlockElement: HTMLElement | null = useBlockElement(
		entry.blockClientId
	);
	const debouncedToggleBlockHighlight = useDebounce(
		toggleBlockHighlight,
		50
	);
	const floatingRef = useRef< HTMLElement | null >( null );
	const label = useBlockReactionsLabel( entry.blockClientId );

	const registerThread = floating?.registerThread;
	const unregisterThread = floating?.unregisterThread;

	useEffect( () => {
		const floatingEl = floatingRef.current;
		if ( floatingEl && registerThread ) {
			registerThread( entry.id, relatedBlockElement, floatingEl );
		}
		return () => unregisterThread?.( entry.id );
	}, [ relatedBlockElement, entry.id, registerThread, unregisterThread ] );

	useEffect( () => {
		if ( ! isSelected ) {
			return;
		}
		scrollNoteThreadIntoView( entry.id, sidebarRef.current );
	}, [ isSelected, floating?.y, entry.id, sidebarRef ] );

	function deselect() {
		selectNote( undefined );
		toggleBlockSpotlight( entry.blockClientId, false );
	}

	const focusOutside = useFocusOutside( ( event: ReactFocusEvent ) => {
		const target = event.relatedTarget as HTMLElement | null;
		const isNoteFocused = target?.closest(
			'.editor-collab-sidebar-panel__thread'
		);
		if ( ! isNoteFocused ) {
			debouncedToggleBlockHighlight.cancel();
			toggleBlockHighlight( entry.blockClientId, false );
		}
		if ( getSelectedNote() === entry.id ) {
			deselect();
		}
	} );

	function select() {
		if ( isSelected ) {
			return;
		}
		selectNote( entry.id );
		toggleBlockSpotlight( entry.blockClientId, true );
		// Pass `null` as the second parameter to prevent focusing the block.
		selectBlock( entry.blockClientId, null );
	}

	return (
		<FloatingContainer
			floating={
				isFloating ? { y: floating.y, ref: floatingRef } : undefined
			}
			className={ clsx(
				'editor-collab-sidebar-panel__thread',
				'editor-collab-sidebar-panel__block-reactions-entry',
				{ 'is-selected': isSelected }
			) }
			id={ `note-thread-${ entry.id }` }
			style={ undefined }
			gap="md"
			onClick={ select }
			onMouseEnter={ () =>
				debouncedToggleBlockHighlight( entry.blockClientId, true )
			}
			onMouseLeave={ () =>
				debouncedToggleBlockHighlight( entry.blockClientId, false )
			}
			{ ...focusOutside }
			onFocus={ ( event: ReactFocusEvent< HTMLElement > ) => {
				focusOutside.onFocus( event );
				debouncedToggleBlockHighlight.cancel();
				toggleBlockHighlight( entry.blockClientId, true );
			} }
			onKeyDown={ onKeyDown }
			tabIndex={ 0 }
			role="treeitem"
			aria-label={ label }
			aria-expanded={ isSelected }
		>
			<BlockReactionsRow
				clientId={ entry.blockClientId }
				reactionsId={ entry.reactionsId }
				reactions={ entry.reactions }
				onToggleBlockReaction={ onToggleBlockReaction }
				onRemoveLast={ () => {
					// The entry unmounts with its last pill, so focus has to
					// leave before that happens.
					deselect();
					relatedBlockElement?.focus();
				} }
			/>
			<Button
				className="editor-collab-sidebar-panel__skip-to-block"
				variant="secondary"
				size="compact"
				onClick={ ( event: MouseEvent< HTMLElement > ) => {
					event.stopPropagation();
					relatedBlockElement?.focus();
				} }
			>
				{ __( 'Back to block' ) }
			</Button>
		</FloatingContainer>
	);
}
