/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../../utils/create-higher-order-component';
// eslint-disable-next-line no-duplicate-imports
import type { HigherOrderComponent } from '../../utils/create-higher-order-component';

/**
 * Higher-order component creator, creating a new component which renders if
 * the given condition is satisfied or with the given optional prop name.
 *
 * @example
 * ```ts
 * type Props = { foo: string };
 * const Component = ( props: Props ) => <div>{ props.foo }</div>;
 * const ConditionalComponent = ifCondition( ( props: Props ) => props.foo.length !== 0 )( Component );
 * <ConditionalComponent foo="" />; // => null
 * <ConditionalComponent foo="bar" />; // => <div>bar</div>;
 * ```
 *
 * @param predicate Function to test condition.
 *
 * @return Higher-order component.
 */
const ifCondition = < TProps, >(
	predicate: ( props: TProps ) => boolean
): HigherOrderComponent< TProps, TProps > =>
	createHigherOrderComponent(
		( WrappedComponent ) => ( props: TProps ) => {
			if ( ! predicate( props ) ) {
				return null;
			}

			return <WrappedComponent { ...props } />;
		},
		'ifCondition'
	);

export default ifCondition;
