/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../../utils/create-higher-order-component';

/**
 * Higher-order component creator, creating a new component which renders if
 * the given condition is satisfied or with the given optional prop name.
 *
 * @template {{}} T
 * @param {(props: T) => boolean} predicate Function to test condition.
 *
 * @return {(Component: import('react').ComponentType<T>) => import('react').ComponentType<T>} Higher-order component.
 */
const ifCondition = ( predicate ) =>
	createHigherOrderComponent(
		( WrappedComponent ) => ( props ) => {
			if ( ! predicate( props ) ) {
				return null;
			}

			return <WrappedComponent { ...props } />;
		},
		'ifCondition'
	);

export default ifCondition;
