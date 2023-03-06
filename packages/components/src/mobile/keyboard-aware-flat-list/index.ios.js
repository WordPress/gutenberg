/**
 * External dependencies
 */

import { FlatList, Keyboard, useWindowDimensions } from 'react-native';
import Animated, {
	useAnimatedScrollHandler,
	useSharedValue,
} from 'react-native-reanimated';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import RCTAztecView from '@wordpress/react-native-aztec';

const AnimatedFlatList = Animated.createAnimatedComponent( FlatList );

export const KeyboardAwareFlatList = ( {
	extraScrollHeight,
	innerRef,
	inputAccessoryViewHeight,
	onScroll,
	scrollEnabled,
	shouldPreventAutomaticScroll,
	...props
} ) => {
	const [ keyboardSpace, setKeyboardSpace ] = useState( 0 );
	const { height: windowHeight } = useWindowDimensions();

	const listRef = useRef();
	const isEditingText = useRef( RCTAztecView.InputState.isFocused() );
	const isKeyboardVisible = useRef( false );
	const currentCaretYCoordinate = useRef( null );

	const latestContentOffsetY = useSharedValue( -1 );

	const offsetExtraSpace = extraScrollHeight + inputAccessoryViewHeight;
	const screenOffset = windowHeight - ( keyboardSpace + offsetExtraSpace );

	const scrollHandler = useAnimatedScrollHandler( {
		onScroll: ( event ) => {
			const { contentOffset } = event;
			latestContentOffsetY.value = contentOffset.y;
			onScroll( event );
		},
	} );

	useEffect( () => {
		let willShowSubscription;
		let showSubscription;
		let hideSubscription;

		if ( scrollEnabled ) {
			willShowSubscription = Keyboard.addListener(
				'keyboardWillShow',
				() => {
					isKeyboardVisible.current = true;
				}
			);
			showSubscription = Keyboard.addListener(
				'keyboardDidShow',
				( { endCoordinates } ) => {
					if ( keyboardSpace === 0 && endCoordinates.height !== 0 ) {
						setKeyboardSpace( endCoordinates.height );
					}
				}
			);
			hideSubscription = Keyboard.addListener( 'keyboardWillHide', () => {
				if ( ! RCTAztecView.InputState.isFocused() ) {
					setKeyboardSpace( 0 );
				}
				isKeyboardVisible.current = false;
			} );
		}
		return () => {
			willShowSubscription?.remove();
			showSubscription?.remove();
			hideSubscription?.remove();
		};
	}, [ scrollEnabled, keyboardSpace, isKeyboardVisible ] );

	const onScrollToInput = useCallback( () => {
		if (
			! isEditingText.current ||
			! scrollEnabled ||
			! listRef.current ||
			( isKeyboardVisible.current && keyboardSpace === 0 )
		) {
			return;
		}

		const textInput = RCTAztecView.InputState.getCurrentFocusedElement();
		if ( textInput ) {
			textInput.measureInWindow( ( _x, y, _width, height ) => {
				const caretYPosition =
					currentCaretYCoordinate.current || height;
				const textInputOffset = y + caretYPosition;

				const offset =
					latestContentOffsetY.value +
					( textInputOffset - screenOffset );

				if ( offset > 0 && textInputOffset > screenOffset ) {
					listRef.current.scrollToOffset( {
						x: 0,
						offset,
						animated: true,
					} );
				}
			} );
		}
	}, [ scrollEnabled, screenOffset, keyboardSpace, latestContentOffsetY ] );

	useEffect( () => {
		if ( keyboardSpace !== 0 ) {
			onScrollToInput();
		}
	}, [ keyboardSpace, onScrollToInput ] );

	const onCaretChange = useCallback(
		( { caretY } ) => {
			const isFocused =
				!! RCTAztecView.InputState.getCurrentFocusedElement();
			isEditingText.current = isFocused;

			if ( ! isFocused ) {
				return;
			}

			currentCaretYCoordinate.current = caretY;
			onScrollToInput();
		},
		[ onScrollToInput ]
	);

	useEffect( () => {
		if ( scrollEnabled ) {
			RCTAztecView.InputState.addCaretChangeListener( onCaretChange );
		}

		return () => {
			if ( scrollEnabled ) {
				RCTAztecView.InputState.removeCaretChangeListener(
					onCaretChange
				);
			}
		};
	}, [ scrollEnabled, onCaretChange ] );

	const getRef = useCallback(
		( ref ) => {
			listRef.current = ref;
			innerRef( ref );
		},
		[ innerRef ]
	);

	const contentInset = { bottom: keyboardSpace };

	return (
		<AnimatedFlatList
			{ ...props }
			automaticallyAdjustContentInsets={ false }
			contentInset={ contentInset }
			onScroll={ scrollHandler }
			ref={ getRef }
			scrollEnabled={ scrollEnabled }
		/>
	);
};

export default KeyboardAwareFlatList;
