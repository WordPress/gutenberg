/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * WordPress dependencies
 */
import { useState, useRef, useCallback } from '@wordpress/element';
import {
	createHigherOrderComponent,
	useIsomorphicLayoutEffect,
} from '@wordpress/compose';

type Props = {
	node?: HTMLElement;
	[ key: string ]: any;
};

export default (
	mapNodeToProps: (
		node: HTMLElement,
		props: Props
	) => { [ key: string ]: any }
) =>
	createHigherOrderComponent( ( WrappedComponent ) => {
		return function WithFallbackStyles( props: Props ) {
			const [ fallbackStyles, setFallbackStyles ] = useState<
				{ [ key: string ]: any } | undefined
			>( undefined );
			const [ grabStylesCompleted, setGrabStylesCompleted ] =
				useState( false );

			const nodeRef = useRef< HTMLElement | undefined >( props.node );

			const bindRef = useCallback( ( node: HTMLDivElement | null ) => {
				if ( ! node ) {
					return;
				}
				nodeRef.current = node;
			}, [] );

			// The original class grabbed the fallback styles synchronously in
			// componentDidMount and componentDidUpdate (i.e. after every render,
			// before paint). useIsomorphicLayoutEffect with no dependency array
			// preserves that timing and stays SSR-safe.
			useIsomorphicLayoutEffect( () => {
				if ( nodeRef.current && ! grabStylesCompleted ) {
					const newFallbackStyles = mapNodeToProps(
						nodeRef.current,
						props
					);

					if (
						! fastDeepEqual( newFallbackStyles, fallbackStyles )
					) {
						setFallbackStyles( newFallbackStyles );
						setGrabStylesCompleted(
							Object.values( newFallbackStyles ).every( Boolean )
						);
					}
				}
			} );

			const wrappedComponent = (
				<WrappedComponent { ...props } { ...fallbackStyles } />
			);

			return props.node ? (
				wrappedComponent
			) : (
				<div ref={ bindRef }> { wrappedComponent } </div>
			);
		};
	}, 'withFallbackStyles' );
