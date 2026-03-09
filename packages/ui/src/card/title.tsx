import { mergeProps, useRender } from '@base-ui/react';
import { useMergeRefs } from '@wordpress/compose';
import {
	forwardRef,
	useContext,
	useLayoutEffect,
	useRef,
} from '@wordpress/element';
import { TitleTextContext } from './context';
import styles from './style.module.css';
import type { TitleProps } from './types';

/**
 * Syncs the rendered text content of the given element to the nearest
 * TitleTextContext (used by CollapsibleCard to build the trigger's
 * accessible label). No-ops when rendered outside a CollapsibleCard.
 *
 * Runs on every render so the label stays current if children change
 * dynamically. The cost is a single `textContent` read plus a bail-out
 * `setState` when the value hasn't changed — skipped entirely when
 * there is no context provider (i.e. the common non-collapsible case).
 */
function useSyncTitleText( ref: React.RefObject< HTMLElement | null > ) {
	const titleTextContext = useContext( TitleTextContext );

	useLayoutEffect( () => {
		if ( ! titleTextContext ) {
			return;
		}

		const text = ref.current?.textContent?.trim() || undefined;
		titleTextContext.setTitleText( text );
	} );

	// Unmount-only cleanup — kept separate from the per-render sync
	// above to avoid transiently clearing the value between runs.
	useLayoutEffect( () => {
		if ( ! titleTextContext ) {
			return;
		}

		return () => titleTextContext.setTitleText( undefined );
	}, [ titleTextContext ] );
}

/**
 * The title for a card. Renders as a `<div>` by default — use the `render`
 * prop to swap in a semantic heading element when appropriate.
 */
export const Title = forwardRef< HTMLDivElement, TitleProps >(
	function CardTitle( { render, ...restProps }, forwardedRef ) {
		const internalRef = useRef< HTMLDivElement >( null );
		const mergedRef = useMergeRefs( [ internalRef, forwardedRef ] );

		useSyncTitleText( internalRef );

		const element = useRender( {
			defaultTagName: 'div',
			render,
			ref: mergedRef,
			// TODO: use `Text` component instead, when ready
			props: mergeProps< 'div' >(
				{ className: styles.title },
				restProps
			),
		} );

		return element;
	}
);
