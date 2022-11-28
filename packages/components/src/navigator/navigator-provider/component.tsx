/**
 * WordPress dependencies
 */
import {
	useMemo,
	useState,
	useCallback,
	Children,
	isValidElement,
} from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { contextConnectWithoutRef } from '../../ui/context/context-connect';
import { NavigatorContext } from '../context';
import type {
	NavigatorProviderProps,
	NavigatorLocation,
	NavigatorContext as NavigatorContextType,
} from '../types';
import { NavigatorScreen } from '../navigator-screen';
import { NavigatorContainer } from '../navigator-container';

function UnconnectedNavigatorProvider(
	props: WordPressComponentProps< NavigatorProviderProps, 'div', false >
) {
	const contextProps = useContextSystem( props, 'NavigatorProvider' );
	const { initialPath } = contextProps;
	let { children } = contextProps;

	const hasScreenChildren = Children.toArray( children ).some(
		( child ) => isValidElement( child ) && child.type === NavigatorScreen
	);
	if ( hasScreenChildren ) {
		deprecated( 'NavigatorScreen as child of NavigatorProvider', {
			since: '6.2',
			version: '6.3',
			alternative: 'NavigatorContainer',
		} );
		children = <NavigatorContainer>{ children }</NavigatorContainer>;
	}

	const [ locationHistory, setLocationHistory ] = useState<
		NavigatorLocation[]
	>( [
		{
			path: initialPath,
		},
	] );

	const goTo: NavigatorContextType[ 'goTo' ] = useCallback(
		( path, options = {} ) => {
			setLocationHistory( [
				...locationHistory,
				{
					...options,
					path,
					isBack: false,
					hasRestoredFocus: false,
				},
			] );
		},
		[ locationHistory ]
	);

	const goBack: NavigatorContextType[ 'goBack' ] = useCallback( () => {
		if ( locationHistory.length > 1 ) {
			setLocationHistory( [
				...locationHistory.slice( 0, -2 ),
				{
					...locationHistory[ locationHistory.length - 2 ],
					isBack: true,
					hasRestoredFocus: false,
				},
			] );
		}
	}, [ locationHistory ] );

	const navigatorContextValue: NavigatorContextType = useMemo(
		() => ( {
			location: {
				...locationHistory[ locationHistory.length - 1 ],
				isInitial: locationHistory.length === 1,
			},
			goTo,
			goBack,
		} ),
		[ locationHistory, goTo, goBack ]
	);

	return (
		<NavigatorContext.Provider value={ navigatorContextValue }>
			{ children }
		</NavigatorContext.Provider>
	);
}

/**
 * The `NavigatorProvider` component allows rendering nested views/panels/menus
 * (via the `NavigatorScreen` component) and navigate between these different
 * view (via the `NavigatorButton` and `NavigatorBackButton` components or the
 * `useNavigator` hook).
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
export const NavigatorProvider = contextConnectWithoutRef(
	UnconnectedNavigatorProvider,
	'NavigatorProvider'
);

export default NavigatorProvider;
