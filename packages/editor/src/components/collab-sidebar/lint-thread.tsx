import type {
	CSSProperties,
	ComponentType,
	KeyboardEvent,
	MouseEvent,
	ReactNode,
	Ref,
} from 'react';
import clsx from 'clsx';
import { useEffect, useRef } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { FloatingContainer } from './floating-container';
import { LintCard } from '../document-annotations';
import type { LintItem } from '../document-annotations';
import { unlock } from '../../lock-unlock';

const { useBlockElement } = unlock( blockEditorPrivateApis );

type FloatingContainerProps = {
	floating?: { y?: number; ref: Ref< HTMLDivElement > };
	className?: string;
	style?: CSSProperties;
	children?: ReactNode;
	[ key: string ]: unknown;
};

// `floating-container.jsx` is untyped JavaScript, so TypeScript infers every
// destructured prop as required. Narrow it here rather than touching the
// shared component, which is the notes plumbing this branch builds on.
const Floating = FloatingContainer as ComponentType< FloatingContainerProps >;

type LintThreadProps = {
	/**
	 * The lint finding to render.
	 */
	item: LintItem;

	/**
	 * Whether the finding's block is the selected one.
	 */
	isSelected: boolean;

	/**
	 * Floating board placement and registration, when floating.
	 */
	floating?: {
		y?: number;
		registerThread: (
			id: string,
			blockEl: HTMLElement | null,
			floatingEl: HTMLElement
		) => void;
		unregisterThread: ( id: string ) => void;
	};

	onKeyDown: ( event: KeyboardEvent< HTMLElement > ) => void;
};

// A lint finding rendered as a thread, sharing the note thread's canvas chrome
// (floating card, block highlight, keyboard navigation). Lint items are
// derived from the block tree rather than backed by comments, so this is a
// read-only surface: selecting it focuses the offending block instead of
// expanding a discussion.
export function LintThread( {
	item,
	isSelected,
	floating,
	onKeyDown,
}: LintThreadProps ) {
	const isFloating = !! floating;
	const { toggleBlockHighlight, selectBlock } = unlock(
		useDispatch( blockEditorStore )
	);
	const relatedBlockElement = useBlockElement( item.blockClientId );
	const debouncedToggleBlockHighlight = useDebounce(
		toggleBlockHighlight,
		50
	);
	const floatingRef = useRef< HTMLDivElement >( null );

	const registerThread = floating?.registerThread;
	const unregisterThread = floating?.unregisterThread;

	// Register the block + floating elements with the board so the card floats
	// aligned to its block, exactly like a note thread.
	useEffect( () => {
		const floatingEl = floatingRef.current;
		if ( floatingEl && registerThread ) {
			registerThread( item.id, relatedBlockElement, floatingEl );
		}
		return () => unregisterThread?.( item.id );
	}, [ relatedBlockElement, item.id, registerThread, unregisterThread ] );

	function selectRelatedBlock() {
		if ( ! item.blockClientId ) {
			return;
		}
		// Pass `null` as the second parameter to prevent focusing the block.
		selectBlock( item.blockClientId, null );
		// Discard a hover toggle still in flight so it can't undo this.
		debouncedToggleBlockHighlight.cancel();
		toggleBlockHighlight( item.blockClientId, true );
	}

	return (
		<Floating
			floating={
				isFloating ? { y: floating.y, ref: floatingRef } : undefined
			}
			className={ clsx( 'editor-collab-sidebar-panel__thread', {
				'is-selected': isSelected,
			} ) }
			id={ `note-thread-${ item.id }` }
			gap="md"
			onClick={ selectRelatedBlock }
			onMouseEnter={ () =>
				debouncedToggleBlockHighlight( item.blockClientId, true )
			}
			onMouseLeave={ () =>
				debouncedToggleBlockHighlight( item.blockClientId, false )
			}
			onKeyDown={ onKeyDown }
			tabIndex={ 0 }
			role="treeitem"
			aria-label={ sprintf(
				// translators: %s: lint suggestion text.
				__( 'Suggestion: %s' ),
				item.body
			) }
		>
			<LintCard item={ item } />
			{ !! item.blockClientId && (
				<Button
					className="editor-collab-sidebar-panel__skip-to-block"
					variant="secondary"
					size="compact"
					onClick={ ( event: MouseEvent< HTMLButtonElement > ) => {
						event.stopPropagation();
						relatedBlockElement?.focus();
					} }
				>
					{ __( 'Back to block' ) }
				</Button>
			) }
		</Floating>
	);
}
