/**
 * WordPress dependencies
 */
import { compose, getWrapperDisplayName } from '@wordpress/element';

/**
 * Higher-order component creator, creating a new component which is composed
 * with the given HOCs if the given condition is satisfied.
 *
 * @param {Function} predicate Function to test condition.
 * @param {Array}    enhancers HOCs to apply if the condition is true.
 *
 * @return {Function} Higher-order component.
 */
export default ( predicate, enhancers ) => ( WrappedComponent ) => {
	const EnhancedComponent = ( props ) => {
		let Component = WrappedComponent;
		if ( predicate( props ) ) {
			Component = compose( enhancers )( WrappedComponent );
		}
		return <Component { ...props } />;
	};

	EnhancedComponent.displayName = getWrapperDisplayName( WrappedComponent, 'ifCondition' );

	return EnhancedComponent;
};
