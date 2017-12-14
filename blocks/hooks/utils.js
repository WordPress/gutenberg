/**
 * WordPress dependencies
 */
import { isValidElement, Children, cloneElement } from '@wordpress/element';

export function mapElements( children, cb ) {
	return Children.map( children, child => {
		if ( ! isValidElement( child ) ) {
			return child;
		}

		const newChild = cb( child );
		// If a new child is returned then we should not traverse its children
		if ( newChild === child ) {
			const childProps = { ...child.props, children: mapElements( child.props.children, cb ) };
			return cloneElement( child, childProps );
		}

		return newChild;
	} );
}
