import { mergeProps } from '@base-ui/react';
import { useMergeRefs } from '@wordpress/compose';
import {
	forwardRef,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { Stack } from '../stack';
import { VisuallyHidden } from '../visually-hidden';
import { NoticeListContext, type Announcement } from './context';
import type { ListProps } from './types';

/**
 * Stacks notices and announces their added or changed messages. Mount the list
 * before adding notices. Initial notices are silent, as are updates while
 * keyboard focus is inside the list. Removing a notice does not announce it.
 */
export const List = forwardRef< HTMLDivElement, ListProps >(
	function NoticeList( { children, ...props }, ref ) {
		const [ element, setElement ] = useState< HTMLDivElement | null >(
			null
		);
		const mergedRef = useMergeRefs( [ ref, setElement ] );
		const [ hasFocus, setHasFocus ] = useState( false );
		const [ announcements, setAnnouncements ] = useState(
			new Map< string, Announcement >()
		);
		const notices = useRef( new Map< string, () => Announcement >() );
		const updateRef = useRef< () => void >( () => {} );
		const isUpdatePending = useRef( false );

		const update = useCallback( () => {
			if ( isUpdatePending.current ) {
				return;
			}
			isUpdatePending.current = true;
			// Read after the commit so title and description elements, refs,
			// and any consumer focus effects have finished.
			queueMicrotask( () => {
				isUpdatePending.current = false;
				updateRef.current();
			} );
		}, [] );
		const register = useCallback(
			( notice: string, read: () => Announcement ) => {
				notices.current.set( notice, read );
				update();
				return () => {
					notices.current.delete( notice );
					update();
				};
			},
			[ update ]
		);

		useEffect( () => {
			if ( ! element ) {
				return;
			}
			const readNotices = () =>
				new Map(
					Array.from( notices.current, ( [ notice, read ] ) => [
						notice,
						read(),
					] )
				);
			// Establish the initial content without populating the live regions.
			let previous = readNotices();
			updateRef.current = () => {
				const current = readNotices();
				const changed = new Map< string, Announcement >();
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
				const isFocused = element.contains(
					element.ownerDocument.activeElement
				);
				setHasFocus( isFocused );
				if ( isFocused ) {
					return;
				}
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
			};
			// Descendant components can update their own text without re-rendering
			// Notice.Root, so React props alone cannot track message changes.
			const observer =
				new element.ownerDocument.defaultView!.MutationObserver(
					update
				);
			observer.observe( element, {
				childList: true,
				characterData: true,
				subtree: true,
				attributeFilter: [ 'hidden', 'aria-hidden' ],
			} );
			return () => {
				observer.disconnect();
				updateRef.current = () => {};
			};
		}, [ element, update ] );

		return (
			<NoticeListContext.Provider value={ register }>
				<Stack
					ref={ mergedRef }
					direction="column"
					gap="sm"
					{ ...mergeProps< 'div' >(
						{
							onFocusCapture() {
								setHasFocus( true );
								setAnnouncements( new Map() );
							},
							onBlurCapture( event ) {
								if (
									! event.currentTarget.contains(
										event.relatedTarget
									)
								) {
									setHasFocus( false );
								}
							},
						},
						props
					) }
					data-wp-ui-notice-list=""
				>
					<>{ children }</>
					{ ! hasFocus &&
						( [ 'polite', 'assertive' ] as const ).map(
							( politeness ) => (
								<VisuallyHidden
									key={ politeness }
									role={
										politeness === 'polite'
											? 'status'
											: 'alert'
									}
									aria-atomic={ false }
									aria-relevant="additions text"
								>
									{ Array.from(
										announcements,
										( [ notice, announcement ] ) =>
											announcement.politeness ===
											politeness ? (
												<div
													key={ notice }
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
			</NoticeListContext.Provider>
		);
	}
);
