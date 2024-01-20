/**
 * External dependencies
 */

import { ScrollView, FlatList } from 'react-native';
import Animated from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	forwardRef,
	useImperativeHandle,
} from '@wordpress/element';
import { useThrottle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import useScroll from './use-scroll';
import useTextInputOffset from './use-text-input-offset';
import useTextInputCaretPosition from './use-text-input-caret-position';

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
	const {
		scrollViewRef,
		scrollHandler,
		keyboardOffset,
		scrollToSection,
		scrollToElement,
		onContentSizeChange,
		lastScrollTo,
	} = useScroll( {
		scrollEnabled,
		shouldPreventAutomaticScroll,
		extraScrollHeight,
		onScroll,
		onSizeChange,
	} );

	const [ getTextInputOffset ] = useTextInputOffset(
		scrollEnabled,
		scrollViewRef
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

	const [ currentCaretData ] = useTextInputCaretPosition( scrollEnabled );

	const onSizeChange = useCallback(
		() => onScrollToTextInput( currentCaretData ),
		[ currentCaretData, onScrollToTextInput ]
	);

	useEffect( () => {
		onScrollToTextInput( currentCaretData );
	}, [ currentCaretData, onScrollToTextInput ] );

	// Adds content insets when the keyboard is opened to have
	// extra padding at the bottom.
	const contentInset = { bottom: keyboardOffset };

	const style = [ { flex: 1 }, scrollViewStyle ];

	useImperativeHandle( ref, () => {
		return {
			scrollViewRef: scrollViewRef.current,
			scrollToSection,
			scrollToElement,
			lastScrollTo,
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
