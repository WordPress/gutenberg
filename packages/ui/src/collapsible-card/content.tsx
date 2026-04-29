import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useEffect, useRef, useState } from '@wordpress/element';
import clsx from 'clsx';
import * as Card from '../card';
import * as Collapsible from '../collapsible';
import styles from './style.module.css';
import type { ContentProps } from './types';

/**
 * The collapsible content area of the card. Hidden when collapsed,
 * visible when expanded.
 */
export const Content = forwardRef< HTMLDivElement, ContentProps >(
	function CollapsibleCardContent(
		{ className, render, children, hiddenUntilFound = true, ...restProps },
		ref
	) {
		const panelRef = useRef< HTMLDivElement >( null );
		const mergedRef = useMergeRefs( [ ref, panelRef ] );
		// True only when the panel is fully expanded — open AND any
		// open/close transition has settled. While true, the overflow
		// clip is dropped so descendant focus rings aren't cut off.
		const [ isExpanded, setIsExpanded ] = useState( false );

		useEffect( () => {
			const panel = panelRef.current;
			if ( ! panel ) {
				return;
			}

			const sync = () => {
				if ( ! panel.hasAttribute( 'data-open' ) ) {
					setIsExpanded( false );
					return;
				}
				// No active animation? Treat as already settled.
				// Covers `prefers-reduced-motion`, where the height
				// change is instantaneous and `transitionend` never
				// fires.
				if ( panel.getAnimations().length === 0 ) {
					setIsExpanded( true );
				}
				// Otherwise wait for `transitionend`.
			};

			const handleTransitionEnd = ( event: TransitionEvent ) => {
				if (
					event.target !== panel ||
					event.propertyName !== 'height'
				) {
					return;
				}
				setIsExpanded( panel.hasAttribute( 'data-open' ) );
			};

			sync();

			const observer = new MutationObserver( sync );
			observer.observe( panel, {
				attributes: true,
				attributeFilter: [ 'data-open' ],
			} );
			panel.addEventListener( 'transitionend', handleTransitionEnd );

			return () => {
				observer.disconnect();
				panel.removeEventListener(
					'transitionend',
					handleTransitionEnd
				);
			};
		}, [] );

		return (
			<Collapsible.Panel
				ref={ mergedRef }
				className={ clsx(
					styles.content,
					isExpanded && styles[ 'is-expanded' ],
					className
				) }
				hiddenUntilFound={ hiddenUntilFound }
				{ ...restProps }
			>
				<Card.Content
					className={ styles[ 'content-inner' ] }
					render={ render }
				>
					{ children }
				</Card.Content>
			</Collapsible.Panel>
		);
	}
);
