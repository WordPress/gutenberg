import { useEvent, useMergeRefs, useRefEffect } from '@wordpress/compose';
import { createPortal, forwardRef, useRef, useState } from '@wordpress/element';
import { Stack } from '../stack';
import { VisuallyHidden } from '../visually-hidden';
import type { ListProps, RootProps } from './types';
import { getComposedParent } from './get-composed-parent';
import { getAnnouncementText } from './get-announcement-text';
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
	listHidden: boolean;
	spokenMessage?: string;
};

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

function getComparisonText( element: HTMLElement ) {
	const walker = element.ownerDocument.createTreeWalker(
		element,
		NodeFilter.SHOW_TEXT,
		{
			acceptNode( node ) {
				return node.parentElement &&
					isHidden( node.parentElement, element )
					? NodeFilter.FILTER_REJECT
					: NodeFilter.FILTER_ACCEPT;
			},
		}
	);
	let text = '';
	while ( walker.nextNode() ) {
		text += walker.currentNode.textContent;
	}
	return text.trim();
}

function readMessage( root: HTMLElement, getText = getComparisonText ) {
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
						// Keep the message in the comparison while its list is hidden.
						// Revealing the list alone must not replay it.
						const spokenMessage =
							notice.dataset.wpUiNoticeSpokenMessage;
						current.set( notice, {
							id: previous.get( notice )?.id ?? nextId++,
							spokenMessage,
							message: spokenMessage ?? readMessage( notice ),
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
					const changed = new Map<
						HTMLElement,
						Announcement & { updateOnly: boolean }
					>();
					for ( const [ notice, announcement ] of current ) {
						const before = previous.get( notice );
						const textOrUrgencyChanged =
							announcement.message !== before?.message ||
							announcement.politeness !== before?.politeness;
						if (
							! announcement.message ||
							announcement.listHidden ||
							announcement.politeness === 'off' ||
							( ! textOrUrgencyChanged &&
								announcement.spokenMessage ===
									before?.spokenMessage )
						) {
							continue;
						}

						changed.set( notice, {
							...announcement,
							message:
								announcement.spokenMessage ??
								readMessage( notice, getAnnouncementText ),
							// A source switch alone can reformat an existing announcement.
							// Keep initial notices and cleared announcements silent.
							updateOnly: ! textOrUrgencyChanged,
						} );
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
							if (
								announcement.updateOnly &&
								! next.has( notice )
							) {
								continue;
							}
							if ( announcement.message ) {
								next.set( notice, announcement );
							} else {
								next.delete( notice );
							}
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
					attributeFilter: [ 'hidden', 'aria-hidden' ],
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
