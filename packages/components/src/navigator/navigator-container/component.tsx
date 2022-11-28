/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	WordPressComponentProps,
} from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';
import { View } from '../../view';
import type { NavigatorContainerProps } from '../types';

function UnconnectedNavigatorContainer(
	props: WordPressComponentProps< NavigatorContainerProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const { children, className, ...otherProps } = useContextSystem(
		props,
		'NavigatorContainer'
	);

	const cx = useCx();
	const classes = useMemo(
		// Prevents horizontal overflow while animating screen transitions.
		() => cx( css( { overflowX: 'hidden' } ), className ),
		[ className, cx ]
	);

	return (
		<View ref={ forwardedRef } className={ classes } { ...otherProps }>
			{ children }
		</View>
	);
}

/**
 * The `NavigatorContainer` component is a container for `NavigatorScreen`
 * components to be placed in. It should be used in combination with the
 * `NavigatorProvider`, the `NavigatorContainer`, the `NavigatorScreen` and the
 * `NavigatorBackButton` components (or the `useNavigator` hook).
 *
 * @example
 * ```jsx
 * import {
 *   __experimentalNavigatorProvider as NavigatorProvider,
 *   __experimentalNavigatorContainer as NavigatorContainer,
 *   __experimentalNavigatorScreen as NavigatorScreen,
 *   __experimentalNavigatorButton as NavigatorButton,
 *   __experimentalNavigatorBackButton as NavigatorBackButton,
 * } from '@wordpress/components';
 *
 * const MyNavigation = () => (
 *   <NavigatorProvider initialPath="/">
 *     <NavigatorContainer>
 *       <NavigatorScreen path="/">
 *         <p>This is the home screen.</p>
 *          <NavigatorButton path="/child">
 *            Navigate to child screen.
 *         </NavigatorButton>
 *       </NavigatorScreen>
 *
 *       <NavigatorScreen path="/child">
 *         <p>This is the child screen.</p>
 *         <NavigatorBackButton>
 *           Go back
 *         </NavigatorBackButton>
 *       </NavigatorScreen>
 *     </NavigatorContainer>
 *   </NavigatorProvider>
 * );
 * ```
 */
export const NavigatorContainer = contextConnect(
	UnconnectedNavigatorContainer,
	'NavigatorContainer'
);

export default NavigatorContainer;
