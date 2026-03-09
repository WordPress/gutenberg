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
 * The title for a card. Renders as a `<div>` by default — use the `render`
 * prop to swap in a semantic heading element when appropriate.
 */
export const Title = forwardRef< HTMLDivElement, TitleProps >(
	function CardTitle( { render, ...restProps }, forwardedRef ) {
		const titleTextContext = useContext( TitleTextContext );
		const internalRef = useRef< HTMLDivElement >( null );
		const mergedRef = useMergeRefs( [ internalRef, forwardedRef ] );

		// Sync the rendered text content to the parent context (used by
		// CollapsibleCard to build the trigger's accessible label). Runs on
		// every render so the label stays current if children change
		// dynamically. The cost is a single `textContent` read plus a
		// bail-out `setState` when the value hasn't changed.
		useLayoutEffect( () => {
			const text = internalRef.current?.textContent?.trim() || undefined;
			titleTextContext?.setTitleText( text );
		} );

		// Clear the registered text on unmount so the parent can fall back
		// to the header content text. Kept separate from the per-render
		// sync above to avoid transiently clearing the value between runs.
		useLayoutEffect( () => {
			return () => titleTextContext?.setTitleText( undefined );
		}, [ titleTextContext ] );

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
