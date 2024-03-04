/**
 * External dependencies
 */
import {
	useIsFocused,
	useNavigation,
	useFocusEffect,
} from '@react-navigation/native';
import {
	ScrollView,
	TouchableHighlight,
	useWindowDimensions,
	View,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheetContext } from '@wordpress/components';
import { useRef, useCallback, useContext, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { BottomSheetNavigationContext } from './bottom-sheet-navigation-context';
import styles from './styles.scss';

const BottomSheetNavigationScreen = ( {
	children,
	fullScreen,
	isScrollable,
	isNested,
	name,
} ) => {
	const navigation = useNavigation();
	const maxHeight = useRef( 0 );
	const isFocused = useIsFocused();
	const {
		onHandleHardwareButtonPress,
		shouldEnableBottomSheetMaxHeight,
		setIsFullScreen,
		listProps,
		safeAreaBottomInset,
	} = useContext( BottomSheetContext );
	const { height: windowHeight } = useWindowDimensions();

	const { setHeight } = useContext( BottomSheetNavigationContext );

	useFocusEffect(
		useCallback( () => {
			onHandleHardwareButtonPress( () => {
				if ( navigation.canGoBack() ) {
					shouldEnableBottomSheetMaxHeight( true );
					navigation.goBack();
					return true;
				}
				onHandleHardwareButtonPress( null );
				return false;
			} );
			/**
			 * TODO: onHandleHardwareButtonPress stores a single value, which means
			 * future invocations from sibling screens can replace the callback for
			 * the currently active screen. Currently, the empty dependency array
			 * passed to useCallback here is what prevents erroneous callback
			 * replacements, but leveraging memoization to achieve this is brittle and
			 * explicitly discouraged in the React documentation.
			 * https://reactjs.org/docs/hooks-reference.html#usememo
			 *
			 * Ideally, we refactor onHandleHardwareButtonPress to manage multiple
			 * callbacks triggered based upon which screen is currently active.
			 *
			 * Related: https://github.com/WordPress/gutenberg/pull/36328#discussion_r768897546
			 */
			// see https://github.com/WordPress/gutenberg/pull/41166
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [] )
	);

	useFocusEffect(
		useCallback( () => {
			if ( fullScreen ) {
				setHeight( windowHeight );
				setIsFullScreen( true );
			} else if ( maxHeight.current !== 0 ) {
				setIsFullScreen( false );
				setHeight( maxHeight.current );
			}
			return () => {};
		}, [ fullScreen, setHeight, setIsFullScreen, windowHeight ] )
	);

	const onLayout = ( { nativeEvent } ) => {
		if ( fullScreen ) {
			return;
		}
		const { height } = nativeEvent.layout;
		if ( maxHeight.current !== height && isFocused ) {
			maxHeight.current = height;
			setHeight( height );
		}
	};

	return useMemo( () => {
		return isScrollable || isNested ? (
			<View
				onLayout={ onLayout }
				testID={ `navigation-screen-${ name }` }
			>
				{ children }
			</View>
		) : (
			<ScrollView { ...listProps }>
				<TouchableHighlight accessible={ false }>
					<View
						onLayout={ onLayout }
						testID={ `navigation-screen-${ name }` }
					>
						{ children }
						{ ! isNested && (
							<View
								style={ {
									height:
										safeAreaBottomInset ||
										styles.scrollableContent.paddingBottom,
								} }
							/>
						) }
					</View>
				</TouchableHighlight>
			</ScrollView>
		);
		// Disable reason: deferring this refactor to the native team.
		// see https://github.com/WordPress/gutenberg/pull/41166
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		children,
		isFocused,
		safeAreaBottomInset,
		listProps,
		name,
		isScrollable,
		isNested,
		onLayout,
	] );
};

export default BottomSheetNavigationScreen;
