/**
 * External dependencies
 */

import { ScrollView, FlatList, useWindowDimensions } from 'react-native';
import Animated, {
	useAnimatedScrollHandler,
	useSharedValue,
} from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useRef,
	forwardRef,
	useImperativeHandle,
} from '@wordpress/element';
import { useThrottle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useTextInputOffset from './use-text-input-offset';
import useKeyboardOffset from './use-keyboard-offset';
import useTextInputCaretPosition from './use-text-input-caret-position';
import useScrollToSection from './use-scroll-to-section';
import useScrollToElement from './use-scroll-to-element';

const DEFAULT_FONT_SIZE = 16;
const AnimatedScrollView = Animated.createAnimatedComponent( ScrollView );

/** @typedef {import('@wordpress/element').RefObject} RefObject */
/**
 * React component that provides a FlatList that is aware of the keyboard state and can scroll
 * to the currently focused TextInput.
 *
 * @param {Object}    props                              Component props.
 * @param {number}    props.extraScrollHeight            Extra scroll height for the content.
 * @param {Function}  props.onScroll                     Function to be called when the list is scrolled.
 * @param {boolean}   props.scrollEnabled                Whether the list can be scrolled.
 * @param {Object}    props.scrollViewStyle              Additional style for the ScrollView component.
 * @param {boolean}   props.shouldPreventAutomaticScroll Whether to prevent scrolling when there's a Keyboard offset set.
 * @param {Object}    props...                           Other props to pass to the FlatList component.
 * @param {RefObject} ref
 * @return {Component} KeyboardAwareFlatList component.
 */
export const KeyboardAwareFlatList = (
	{
		extraScrollHeight,
		onScroll,
		scrollEnabled,
		scrollViewStyle,
		shouldPreventAutomaticScroll,
		...props
	},
	ref
) => {
	const scrollViewRef = useRef();
	const scrollViewMeasurements = useRef();
	const scrollViewYOffset = useSharedValue( -1 );

	const { height: windowHeight, width: windowWidth } = useWindowDimensions();
	const isLandscape = windowWidth >= windowHeight;

	const [ keyboardOffset ] = useKeyboardOffset(
		scrollEnabled,
		shouldPreventAutomaticScroll
	);

	const [ currentCaretData ] = useTextInputCaretPosition( scrollEnabled );

	const [ getTextInputOffset ] = useTextInputOffset(
		scrollEnabled,
		scrollViewRef
	);

	const [ scrollToSection ] = useScrollToSection(
		extraScrollHeight,
		keyboardOffset,
		scrollEnabled,
		scrollViewMeasurements,
		scrollViewRef,
		scrollViewYOffset
	);
	const [ scrollToElement ] = useScrollToElement(
		scrollViewRef,
		scrollToSection
	);

	const onScrollToTextInput = useThrottle(
		useCallback(
			async ( caret ) => {
				const { caretHeight = DEFAULT_FONT_SIZE } = caret ?? {};
				const textInputOffset = await getTextInputOffset( caret );
				const hasTextInputOffset = textInputOffset !== null;

				if ( hasTextInputOffset ) {
					scrollToSection( textInputOffset, caretHeight );
				}
			},
			[ getTextInputOffset, scrollToSection ]
		),
		200,
		{ leading: false }
	);

	useEffect( () => {
		onScrollToTextInput( currentCaretData );
	}, [ currentCaretData, onScrollToTextInput ] );

	// When the orientation changes, the ScrollView measurements
	// need to be re-calculated.
	useEffect( () => {
		scrollViewMeasurements.current = null;
	}, [ isLandscape ] );

	const scrollHandler = useAnimatedScrollHandler( {
		onScroll: ( event ) => {
			const { contentOffset } = event;
			scrollViewYOffset.value = contentOffset.y;
			onScroll( event );
		},
	} );

	const measureScrollView = useCallback( () => {
		if ( scrollViewRef.current ) {
			const scrollRef = scrollViewRef.current.getNativeScrollRef();

			scrollRef.measureInWindow( ( _x, y, width, height ) => {
				scrollViewMeasurements.current = { y, width, height };
			} );
		}
	}, [] );

	const onContentSizeChange = useCallback( () => {
		onScrollToTextInput( currentCaretData );

		// Sets the first values when the content size changes.
		if ( ! scrollViewMeasurements.current ) {
			measureScrollView();
		}
	}, [ measureScrollView, onScrollToTextInput, currentCaretData ] );

	// Adds content insets when the keyboard is opened to have
	// extra padding at the bottom.
	const contentInset = { bottom: keyboardOffset };

	const style = [ { flex: 1 }, scrollViewStyle ];

	useImperativeHandle( ref, () => {
		return {
			scrollViewRef: scrollViewRef.current,
			scrollToSection,
			scrollToElement,
		};
	} );

	return (
		<AnimatedScrollView
			automaticallyAdjustContentInsets={ false }
			contentInset={ contentInset }
			keyboardShouldPersistTaps="handled"
			onContentSizeChange={ onContentSizeChange }
			onScroll={ scrollHandler }
			ref={ scrollViewRef }
			scrollEnabled={ scrollEnabled }
			scrollEventThrottle={ 16 }
			style={ style }
		>
			<FlatList { ...props } scrollEnabled={ false } />
		</AnimatedScrollView>
	);
};

export default forwardRef( KeyboardAwareFlatList );
