/**
 * WordPress dependencies
 */
import { getWrapperDisplayName } from '@wordpress/element';

/**
 * A Higher Order Component that provides a way to conditionally
 * render a component depending on its props.
 *
 * @param {Function} predicate A predicate that receives the props passed to the component.
 *                             Returns true if the component should be rendered and false otherwise.
 *
 * @returns {Component} Wrapped component.
 */
function ifPropsVerify( predicate ) {
	return ( OriginalComponent ) => {
		const WrappedComponent = ( props ) => predicate && predicate( props ) && <OriginalComponent { ...props } />;
		WrappedComponent.displayName = getWrapperDisplayName( WrappedComponent, 'ifPropsVerify' );
		return WrappedComponent;
	};
}

export default ifPropsVerify;
