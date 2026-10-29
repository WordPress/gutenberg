import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { forwardRef, useState } from '@wordpress/element';
import { Stack } from '../stack';
import { VisuallyHidden } from '../visually-hidden';
import type { ListProps, RootProps } from './types';
import styles from './style.module.css';

const LIST_SELECTOR = '[data-wp-ui-notice-list]';
const CONTENT_BOUNDARY = `.${ styles.notice }, .${ styles.actions }, ${ LIST_SELECTOR }`;
const HIDDEN_CONTENT = '[hidden], [aria-hidden="true"]';

type Announcement = {
	id: number;
	message: string;
	politeness: NonNullable< RootProps[ 'politeness' ] >;
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

function readMessage( root: HTMLElement ) {
	function readText( kind: 'title' | 'description' ) {
		return Array.from(
			root.querySelectorAll< HTMLElement >( `.${ styles[ kind ] }` )
		)
			.filter(
				( element ) =>
					element.closest( CONTENT_BOUNDARY ) === root &&
					! isHidden( element, root )
			)
			.map( ( element ) => {
				const walker = element.ownerDocument.createTreeWalker(
					element,
					NodeFilter.SHOW_TEXT,
					{
						acceptNode( node ) {
							return node.parentElement &&
								isHidden( node.parentElement, root )
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
			} )
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
	function NoticeList( { children, ...props }, ref ) {
		const [ announcements, setAnnouncements ] = useState(
			new Map< HTMLElement, Announcement >()
		);
		const observerRef = useRefEffect< HTMLDivElement >( ( element ) => {
			let nextId = 0;
			let previous = new Map< HTMLElement, Announcement >();
			const readNotices = () =>
				new Map(
					Array.from(
						element.querySelectorAll< HTMLElement >(
							`.${ styles.notice }`
						)
					)
						.filter(
							( notice ) =>
								notice.closest( LIST_SELECTOR ) === element &&
								! isHidden( notice, element )
						)
						.map( ( notice ) => [
							notice,
							{
								id: previous.get( notice )?.id ?? nextId++,
								message:
									notice.dataset.wpUiNoticeSpokenMessage ??
									readMessage( notice ),
								politeness: notice.dataset
									.wpUiNoticePoliteness as Announcement[ 'politeness' ],
							},
						] )
				);
			// Establish initial content without populating the live regions.
			previous = readNotices();
			setAnnouncements( ( existing ) =>
				existing.size ? new Map() : existing
			);
			// Descendant components can change their own text without re-rendering
			// Notice.Root. Observe message props and content in the same DOM batch.
			const observer = new MutationObserver( () => {
				const current = readNotices();
				const changed = new Map< HTMLElement, Announcement >();
				for ( const [ notice, announcement ] of current ) {
					const before = previous.get( notice );
					if (
						announcement.message &&
						announcement.politeness !== 'off' &&
						( announcement.message !== before?.message ||
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
			} );
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
			return () => observer.disconnect();
		}, [] );
		const mergedRef = useMergeRefs( [ ref, observerRef ] );

		return (
			<Stack
				ref={ mergedRef }
				direction="column"
				gap="sm"
				{ ...props }
				data-wp-ui-notice-list=""
			>
				<>{ children }</>
				{ ( [ 'polite', 'assertive' ] as const ).map(
					( politeness ) => (
						<VisuallyHidden
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
						</VisuallyHidden>
					)
				) }
			</Stack>
		);
	}
);
