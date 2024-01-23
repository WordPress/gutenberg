/**
 * External dependencies
 */
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import {
	useContext,
	useMemo,
	useCallback,
	Children,
	useRef,
	cloneElement,
} from '@wordpress/element';

import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	BottomSheetNavigationContext,
	BottomSheetNavigationProvider,
} from './bottom-sheet-navigation-context';
import { BottomSheetContext } from '../bottom-sheet-context';

import styles from './styles.scss';

const AnimationSpec = {
	animation: 'timing',
	config: {
		duration: 200,
		easing: Easing.ease,
	},
};

const fadeConfig = ( { current } ) => {
	return {
		cardStyle: {
			opacity: current.progress,
		},
	};
};

const options = {
	transitionSpec: {
		open: AnimationSpec,
		close: AnimationSpec,
	},
	headerShown: false,
	gestureEnabled: false,
	cardStyleInterpolator: fadeConfig,
	keyboardHandlingEnabled: false,
};

const HEIGHT_ANIMATION_DURATION = 300;
const DEFAULT_HEIGHT = 1;

function BottomSheetNavigationContainer( {
	children,
	animate,
	main,
	theme,
	style,
	testID,
} ) {
	const Stack = useRef( createStackNavigator() ).current;
	const navigationContext = useContext( BottomSheetNavigationContext );
	const { maxHeight: sheetMaxHeight, isMaxHeightSet: isSheetMaxHeightSet } =
		useContext( BottomSheetContext );
	const currentHeight = useSharedValue(
		navigationContext.currentHeight?.value || DEFAULT_HEIGHT
	);

	const backgroundStyle = usePreferredColorSchemeStyle(
		styles.background,
		styles.backgroundDark
	);

	const defaultTheme = useMemo(
		() => ( {
			...DefaultTheme,
			colors: {
				...DefaultTheme.colors,
				background: backgroundStyle.backgroundColor,
			},
		} ),
		[ backgroundStyle.backgroundColor ]
	);
	const _theme = theme || defaultTheme;

	const setHeight = useCallback(
		( height ) => {
			if (
				height > DEFAULT_HEIGHT &&
				Math.round( height ) !== Math.round( currentHeight.value )
			) {
				// If max height is set in the bottom sheet, we clamp
				// the new height using that value.
				const newHeight = isSheetMaxHeightSet
					? Math.min( sheetMaxHeight, height )
					: height;
				const shouldAnimate =
					animate && currentHeight.value !== DEFAULT_HEIGHT;

				if ( shouldAnimate ) {
					currentHeight.value = withTiming( newHeight, {
						duration: HEIGHT_ANIMATION_DURATION,
						easing: Easing.out( Easing.cubic ),
					} );
				} else {
					currentHeight.value = newHeight;
				}
			}
		},
		[ animate, currentHeight, isSheetMaxHeightSet, sheetMaxHeight ]
	);

	const animatedStyles = useAnimatedStyle( () => ( {
		height: currentHeight.value,
	} ) );

	const screens = useMemo( () => {
		return Children.map( children, ( child ) => {
			let screen = child;
			const { name, ...otherProps } = child.props;
			if ( ! main ) {
				screen = cloneElement( child, {
					...child.props,
					isNested: true,
				} );
			}
			return (
				<Stack.Screen
					name={ name }
					{ ...otherProps }
					children={ () => screen }
				/>
			);
		} );
	}, [ children, main ] );

	return useMemo( () => {
		return (
			<Animated.View
				style={ [ style, animatedStyles ] }
				testID={ testID }
			>
				<BottomSheetNavigationProvider
					value={ { setHeight, currentHeight } }
				>
					{ main ? (
						<NavigationContainer theme={ _theme }>
							<Stack.Navigator
								screenOptions={ options }
								detachInactiveScreens={ false }
							>
								{ screens }
							</Stack.Navigator>
						</NavigationContainer>
					) : (
						<Stack.Navigator
							screenOptions={ options }
							detachInactiveScreens={ false }
						>
							{ screens }
						</Stack.Navigator>
					) }
				</BottomSheetNavigationProvider>
			</Animated.View>
		);
	}, [
		_theme,
		animatedStyles,
		currentHeight,
		main,
		screens,
		setHeight,
		style,
		testID,
	] );
}

export default BottomSheetNavigationContainer;
