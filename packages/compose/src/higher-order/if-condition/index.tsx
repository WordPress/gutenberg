/**
 * Internal dependencies
 */
import createHigherOrderComponent from '../../utils/create-higher-order-component';

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
 * @param  predicate Function to test condition.
 *
 * @return Higher-order component.
 */
const ifCondition = < TProps extends Record< string, any > >(
	predicate: ( props: TProps ) => boolean
) =>
	createHigherOrderComponent< {} >(
		( WrappedComponent ) => ( props ) => {
			if ( ! predicate( props as TProps ) ) {
				return null;
			}

			return <WrappedComponent { ...props } />;
		},
		'ifCondition'
	);

export default ifCondition;
