/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
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

			// Derived from fallbackStyles: the grab is complete once every
			// mapped value has resolved to a truthy style.
			const grabStylesCompleted =
				!! fallbackStyles &&
				Object.values( fallbackStyles ).every( Boolean );

			const nodeRef = useRef< HTMLDivElement | null >( null );

			// Runs before paint, matching the original componentDidMount /
			// componentDidUpdate, so the fallback styles apply without a flash.
			useIsomorphicLayoutEffect( () => {
				const node = props.node ?? nodeRef.current;
				if ( node && ! grabStylesCompleted ) {
					const newFallbackStyles = mapNodeToProps( node, props );

					if (
						! fastDeepEqual( newFallbackStyles, fallbackStyles )
					) {
						setFallbackStyles( newFallbackStyles );
					}
				}
			} );

			const wrappedComponent = (
				<WrappedComponent { ...props } { ...fallbackStyles } />
			);

			return props.node ? (
				wrappedComponent
			) : (
				<div ref={ nodeRef }> { wrappedComponent } </div>
			);
		};
	}, 'withFallbackStyles' );
