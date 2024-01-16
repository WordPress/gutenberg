/**
 * Internal dependencies
 */
import { COMPONENT_NAMESPACE, CONNECTED_NAMESPACE } from './constants';
import { getStyledClassNameFromKey } from './get-styled-class-name-from-key';

/**
 * The context system adds some props (ie. classnames, data attributes) to the
 * props object returned by the `useContextSystem` hook. This utility function
 * strips those extra values off, in case they are not needed by the consumer.
 *
 * @param props     The props returned by the `useContextSystem` hook
 * @param namespace The namespace used to connect the component to the context system
 * @return A props object without some context system-specific props
 */
export function removeExtraPropsAddedByContext<
	T extends { className?: string; [ key: string ]: unknown },
>( props: T, namespace: string ) {
	return Object.entries( props ).reduce(
		( accObj, [ currentKey, currentValue ] ) => {
			if ( currentKey === 'className' ) {
				return {
					...accObj,
					[ currentKey ]: ( currentValue as string )
						// remove the styled classname
						.replace( getStyledClassNameFromKey( namespace ), '' )
						// replace 2+ spaces with single space
						.replace( /\s+/g, ' ' ),
				};
			} else if (
				! [ COMPONENT_NAMESPACE, CONNECTED_NAMESPACE ].includes(
					currentKey
				)
			) {
				// Remove the `COMPONENT_NAMESPACE` and `CONNECTED_NAMESPACE` props
				return {
					...accObj,
					[ currentKey ]: currentValue,
				};
			}

			return accObj;
		},
		{} as T
	);
}
