/**
 * External dependencies
 */
import { camelCase, upperFirst } from 'lodash';

/**
 * Internal dependencies
 */
import pure from '../../higher-order/pure';

/**
 * Given a function mapping a component to an enhanced component, and a modifier
 * name, returns the enhanced component augmented with a generated displayName.
 *
 * @param {Function} mapComponentToEnhancedComponent Function mapping component
 *                                                    to enhanced component.
 * @param {string}   modifierName                    Seed name from which to
 *                                                    generate display name.
 *
 * @return {WPComponent} Component class with generated display name assigned.
 */
export default function createHigherOrderComponent( mapComponentToEnhancedComponent, modifierName ) {
	return ( OriginalComponent ) => {
		const EnhancedComponent = mapComponentToEnhancedComponent( OriginalComponent );
		const { displayName = OriginalComponent.name || 'Component' } = OriginalComponent;
		EnhancedComponent.displayName = `${ upperFirst( camelCase( modifierName ) ) }(${ displayName })`;

		return EnhancedComponent;
	};
}

/**
 * Given a function that returns an object, and a modifier
 * name, returns an enhanced pure component that calls
 * the function and merges the returned object into its props.
 * This is useful for making higher order components from hooks.
 *
 * @param {Function} getMergeProps Function that returns the object to merge into props.
 *
 * @param {string}   modifierName  Seed name from which to generate display name.
 *
 * @return {WPComponent} Component class, with generated display name assigned, that
 *                        merges the result of `getMergeProps` with its own props.
 */
export function createHigherOrderComponentWithMergeProps(
	getMergeProps,
	modifierName
) {
	return createHigherOrderComponent(
		( WrappedComponent ) =>
			pure( ( ownProps ) => (
				<WrappedComponent { ...ownProps } { ...getMergeProps( ownProps ) } />
			) ),
		modifierName
	);
}
