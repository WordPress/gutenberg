/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { createContext, RawHTML } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { serialize } from '../api';

const { Consumer, Provider } = createContext( () => {} );

/**
 * An internal block component used in block content serialization to inject
 * nested block content within the `save` implementation of the ancestor
 * component in which it is nested. The component provides a pre-bound
 * `BlockContent` component via context, which is used by the developer-facing
 * `InnerBlocks.Content` component to render block content.
 *
 * @example
 *
 * ```jsx
 * <BlockContentProvider innerBlocks={ innerBlocks }>
 * 	{ blockSaveElement }
 * </BlockContentProvider>
 * ```
 *
 * @return {WPComponent} Element with BlockContent injected via context.
 */
const BlockContentProvider = ( { children, innerBlocks } ) => {
	const BlockContent = () => {
		// Value is an array of blocks, so defer to block serializer
		const html = serialize( innerBlocks, { isInnerBlocks: true } );

		// Use special-cased raw HTML tag to avoid default escaping
		return <RawHTML>{ html }</RawHTML>;
	};

	return (
		<Provider value={ BlockContent }>
			{ children }
		</Provider>
	);
};

/**
 * A Higher Order Component used to inject BlockContent using context to the
 * wrapped component.
 *
 * @return {WPComponent} Enhanced component with injected BlockContent as prop.
 */
export const withBlockContentContext = createHigherOrderComponent( ( OriginalComponent ) => {
	return ( props ) => (
		<Consumer>
			{ ( context ) => (
				<OriginalComponent
					{ ...props }
					BlockContent={ context }
				/>
			) }
		</Consumer>
	);
}, 'withBlockContentContext' );

export default BlockContentProvider;
