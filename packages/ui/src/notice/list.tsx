import { useEvent, useMergeRefs, useRefEffect } from '@wordpress/compose';
import { createPortal, forwardRef, useRef, useState } from '@wordpress/element';
import { Stack } from '../stack';
import { VisuallyHidden } from '../visually-hidden';
import type { ListProps, RootProps } from './types';
import {
	getAnnouncementText,
	getAnnouncementComparisonText,
} from './get-announcement-text';
import styles from './style.module.css';

const LIST_SELECTOR = '[data-wp-ui-notice-list]';
const CONTENT_BOUNDARY = `.${ styles.notice }, .${ styles.actions }, ${ LIST_SELECTOR }`;
const HIDDEN_CONTENT = '[hidden], [aria-hidden="true"]';

type Announcement = {
	id: number;
	message: string;
	politeness: NonNullable< RootProps[ 'politeness' ] >;
};

type NoticeSnapshot = Announcement & {
	comparison: string | undefined;
	listHidden: boolean;
};

function getComposedParent( element: Element ): Element | null {
	const ShadowRoot = element.ownerDocument.defaultView?.ShadowRoot;
	return (
		element.assignedSlot ??
		element.parentElement ??
		( ShadowRoot && element.parentNode instanceof ShadowRoot
			? element.parentNode.host
			: null )
	);
}

function isHidden( element: Element, root: Element ) {
	for (
		let current: Element | null = element;
		current;
		current = current.parentElement
	) {
		if ( current.matches( HIDDEN_CONTENT ) ) {
			return true;
		}
		if ( current === root ) {
			break;
		}
	}
	return false;
}

function readMessage( root: HTMLElement, getText = getAnnouncementText ) {
	function readText( kind: 'title' | 'description' ) {
		return Array.from(
			root.querySelectorAll< HTMLElement >( `.${ styles[ kind ] }` )
		)
			.filter(
				( element ) =>
					element.closest( CONTENT_BOUNDARY ) === root &&
					! isHidden( element, root )
			)
			.map( getText )
			.filter( Boolean )
			.join( ' ' );
	}
	const title = readText( 'title' );
	return [ title, readText( 'description' ) ]
		.filter( Boolean )
		.join( /\p{Sentence_Terminal}$/u.test( title ) ? ' ' : '. ' );
}

/**
 * Stacks notices and announces their added or changed messages. Mount the list
 * before adding notices. Initial notices are silent. Removing a notice does not
 * announce it. Set `politeness="off"` on notices that receive focus to avoid
 * duplicate announcements.
 */
export const List = forwardRef< HTMLDivElement, ListProps >(
	function NoticeList( { children, liveRegionContainer, ...props }, ref ) {
		const [ announcements, setAnnouncements ] = useState(
			new Map< HTMLElement, Announcement >()
		);
		const refreshRef = useRef< () => void >( undefined );
		const getNoticeVisibility = useEvent(
			( notice: HTMLElement, list: HTMLElement ) => {
				if ( ! liveRegionContainer ) {
					return isHidden( notice, list ) ? 'hidden' : 'visible';
				}
				// Explicit messages can announce outside an aria-hidden background.
				// Text derived from a notice must still be accessible in the list.
				const selector =
					notice.dataset.wpUiNoticeSpokenMessage === undefined
						? HIDDEN_CONTENT
						: '[hidden]';
				for (
					let current: Element | null = notice;
					current;
					current = getComposedParent( current )
				) {
					if ( current.matches( selector ) ) {
						return current !== list && list.contains( current )
							? 'hidden'
							: 'list-hidden';
					}
				}
				return 'visible';
			}
		);
		const observerRef = useRefEffect< HTMLDivElement >(
			( element ) => {
				let nextId = 0;
				let previous = new Map< HTMLElement, NoticeSnapshot >();
				const readNotices = () => {
					const current = new Map< HTMLElement, NoticeSnapshot >();
					const listVisibility =
						element.ownerDocument.defaultView?.getComputedStyle(
							element
						).visibility;
					const isListVisibilityHidden =
						listVisibility === 'hidden' ||
						listVisibility === 'collapse';
					for ( const notice of element.querySelectorAll< HTMLElement >(
						`.${ styles.notice }`
					) ) {
						if ( notice.closest( LIST_SELECTOR ) !== element ) {
							continue;
						}
						const visibility = getNoticeVisibility(
							notice,
							element
						);
						if ( visibility === 'hidden' ) {
							continue;
						}
						const spokenMessage =
							notice.dataset.wpUiNoticeSpokenMessage;
						const message = spokenMessage ?? readMessage( notice );
						const before = previous.get( notice );
						// Inherited CSS visibility can make the message unreadable.
						// Preserve its last comparison until it can be read again.
						const comparison =
							spokenMessage ??
							( isListVisibilityHidden && ! message
								? before?.comparison
								: readMessage( notice, ( content ) =>
										getAnnouncementComparisonText(
											content,
											element
										)
									) );
						current.set( notice, {
							id: before?.id ?? nextId++,
							message,
							comparison,
							politeness: notice.dataset
								.wpUiNoticePoliteness as Announcement[ 'politeness' ],
							listHidden: visibility === 'list-hidden',
						} );
					}
					return current;
				};
				// Establish initial content without populating the live regions.
				previous = readNotices();
				setAnnouncements( ( existing ) =>
					existing.size ? new Map() : existing
				);
				// Descendant components can change their own text without re-rendering
				// Notice.Root. Observe message props and content in the same DOM batch.
				const refresh = () => {
					const current = readNotices();
					const changed = new Map< HTMLElement, Announcement >();
					for ( const [ notice, announcement ] of current ) {
						const before = previous.get( notice );
						if (
							announcement.message &&
							! announcement.listHidden &&
							announcement.politeness !== 'off' &&
							// The first readable message establishes a silent baseline.
							( ! before || before.comparison !== undefined ) &&
							( announcement.comparison !== before?.comparison ||
								announcement.politeness !== before?.politeness )
						) {
							changed.set( notice, announcement );
						}
					}
					previous = current;
					setAnnouncements( ( existing ) => {
						const next = new Map( existing );
						for ( const notice of existing.keys() ) {
							const announcement = current.get( notice );
							if (
								! announcement?.message ||
								announcement.listHidden ||
								announcement.politeness === 'off'
							) {
								next.delete( notice );
							}
						}
						for ( const [ notice, announcement ] of changed ) {
							next.set( notice, announcement );
						}
						return changed.size || next.size !== existing.size
							? next
							: existing;
					} );
				};
				refreshRef.current = refresh;
				const observer = new MutationObserver( refresh );
				observer.observe( element, {
					childList: true,
					characterData: true,
					subtree: true,
					attributeFilter: [
						'class',
						'style',
						'hidden',
						'aria-hidden',
						'data-wp-ui-notice-politeness',
						'data-wp-ui-notice-spoken-message',
					],
				} );
				return () => {
					observer.disconnect();
					refreshRef.current = undefined;
				};
			},
			[ getNoticeVisibility ]
		);
		const ancestorRef = useRefEffect< HTMLElement >( ( list ) => {
			const observer = new MutationObserver( () =>
				refreshRef.current?.()
			);
			for (
				let parent = getComposedParent( list );
				parent;
				parent = getComposedParent( parent )
			) {
				observer.observe( parent, {
					attributeFilter: [
						'class',
						'style',
						'hidden',
						'aria-hidden',
					],
				} );
			}
			return () => observer.disconnect();
		}, [] );
		const mergedRef = useMergeRefs( [
			ref,
			observerRef,
			liveRegionContainer ? ancestorRef : null,
		] );

		const liveRegions = (
			// Modals can exempt an explicit aria-live container. The child roles
			// set the urgency of each message.
			<VisuallyHidden
				aria-live={ liveRegionContainer ? 'off' : undefined }
			>
				{ ( [ 'polite', 'assertive' ] as const ).map(
					( politeness ) => (
						<div
							key={ politeness }
							role={
								politeness === 'polite' ? 'status' : 'alert'
							}
							aria-atomic={ false }
							aria-relevant="additions text"
						>
							{ Array.from(
								announcements.values(),
								( announcement ) =>
									announcement.politeness === politeness ? (
										<div
											key={ announcement.id }
											aria-atomic="true"
										>
											{ announcement.message }
										</div>
									) : null
							) }
						</div>
					)
				) }
			</VisuallyHidden>
		);

		return (
			<Stack
				ref={ mergedRef }
				direction="column"
				gap="sm"
				{ ...props }
				data-wp-ui-notice-list=""
			>
				<>{ children }</>
				{ liveRegionContainer
					? createPortal( liveRegions, liveRegionContainer )
					: liveRegions }
			</Stack>
		);
	}
);
