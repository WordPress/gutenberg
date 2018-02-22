/**
 * WordPress dependencies
 */
import { getWrapperDisplayName } from '@wordpress/element';

/**
 * Higher-order component creator, creating a new component which renders if
 * the given condition is satisfied or with the given optional prop name.
 *
 * @param {Function} predicate Function to test condition.
 *
 * @return {Function} Higher-order component.
 */
const ifCondition = ( predicate ) => ( WrappedComponent ) => {
	const EnhancedComponent = ( props ) => {
		if ( ! predicate( props ) ) {
			return null;
		}

		return <WrappedComponent { ...props } />;
	};

	EnhancedComponent.displayName = getWrapperDisplayName( WrappedComponent, 'ifCondition' );

	return EnhancedComponent;
};

export default ifCondition;
