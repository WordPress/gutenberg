/**
 * External dependencies
 */
import {
	findNodeHandle,
	requireNativeComponent,
	UIManager,
	Pressable,
	Platform,
	TouchableWithoutFeedback,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import {
	BACKSPACE,
	DELETE,
	DOWN,
	ENTER,
	ESCAPE,
	LEFT,
	RIGHT,
	SPACE,
	UP,
} from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import * as AztecInputState from './AztecInputState';

const AztecManager = UIManager.getViewManagerConfig( 'RCTAztecView' );

// Used to match KeyboardEvent.code values (from the Web API) with native keycodes.
const KEYCODES = {
	[ BACKSPACE ]: 'Backspace',
	[ DELETE ]: 'Delete',
	[ DOWN ]: 'ArrowDown',
	[ ENTER ]: 'Enter',
	[ ESCAPE ]: 'Escape',
	[ LEFT ]: 'ArrowLeft',
	[ RIGHT ]: 'ArrowRight',
	[ SPACE ]: 'Space',
	[ UP ]: 'ArrowUp',
};

class AztecView extends Component {
	constructor() {
		super( ...arguments );
		this.aztecViewRef = createRef();

		this._onContentSizeChange = this._onContentSizeChange.bind( this );
		this._onEnter = this._onEnter.bind( this );
		this._onBackspace = this._onBackspace.bind( this );
		this._onKeyDown = this._onKeyDown.bind( this );
		this._onChange = this._onChange.bind( this );
		this._onHTMLContentWithCursor =
			this._onHTMLContentWithCursor.bind( this );
		this._onFocus = this._onFocus.bind( this );
		this._onBlur = this._onBlur.bind( this );
		this._onSelectionChange = this._onSelectionChange.bind( this );
		this._onPress = this._onPress.bind( this );
		this._onAztecFocus = this._onAztecFocus.bind( this );
		this.blur = this.blur.bind( this );
		this.focus = this.focus.bind( this );
	}

	componentWillUnmount() {
		AztecInputState.blurOnUnmount( this.aztecViewRef.current );
	}

	dispatch( command, params ) {
		params = params || [];
		UIManager.dispatchViewManagerCommand(
			this.aztecViewRef.current,
			command,
			params
		);
	}

	requestHTMLWithCursor() {
		this.dispatch( AztecManager.Commands.returnHTMLWithCursor );
	}

	_onContentSizeChange( event ) {
		this.updateCaretData( event );

		if ( ! this.props.onContentSizeChange ) {
			return;
		}
		const size = event.nativeEvent.contentSize;
		const { onContentSizeChange } = this.props;
		onContentSizeChange( size );
	}

	_onEnter( event ) {
		if ( ! this.isFocused() ) {
			return;
		}

		if ( ! this.props.onKeyDown ) {
			return;
		}

		const { onKeyDown } = this.props;

		const newEvent = { ...event, keyCode: ENTER, code: KEYCODES[ ENTER ] };
		onKeyDown( newEvent );
	}

	_onBackspace( event ) {
		if ( ! this.props.onKeyDown ) {
			return;
		}

		const { onKeyDown } = this.props;

		const newEvent = {
			...event,
			keyCode: BACKSPACE,
			code: KEYCODES[ BACKSPACE ],
			preventDefault: () => {},
		};
		onKeyDown( newEvent );
	}

	_onKeyDown( event ) {
		if ( ! this.props.onKeyDown ) {
			return;
		}

		const { onKeyDown } = this.props;
		const { keyCode } = event.nativeEvent;
		const newEvent = {
			...event,
			keyCode,
			...( KEYCODES[ keyCode ] && {
				code: KEYCODES[ keyCode ],
			} ),
			preventDefault: () => {},
		};
		onKeyDown( newEvent );
	}

	_onHTMLContentWithCursor( event ) {
		if ( ! this.props.onHTMLContentWithCursor ) {
			return;
		}

		const text = event.nativeEvent.text;
		const selectionStart = event.nativeEvent.selectionStart;
		const selectionEnd = event.nativeEvent.selectionEnd;
		const { onHTMLContentWithCursor } = this.props;
		onHTMLContentWithCursor( text, selectionStart, selectionEnd );
	}

	_onFocus( event ) {
		if ( ! this.props.onFocus ) {
			return;
		}

		const { onFocus } = this.props;
		onFocus( event );
	}

	_onBlur( event ) {
		this.selectionEndCaretY = null;

		AztecInputState.blur( this.aztecViewRef.current );

		if ( ! this.props.onBlur ) {
			return;
		}

		const { onBlur } = this.props;
		onBlur( event );
	}

	_onChange( event ) {
		// iOS uses the onKeyDown prop directly from native only when one of the triggerKeyCodes is entered, but
		// Android includes the information needed for onKeyDown in the event passed to onChange.
		if ( Platform.OS === 'android' ) {
			const triggersIncludeEventKeyCode =
				this.props.triggerKeyCodes &&
				this.props.triggerKeyCodes
					.map( ( char ) => char.charCodeAt( 0 ) )
					.includes( event.nativeEvent.keyCode );
			if ( triggersIncludeEventKeyCode ) {
				this._onKeyDown( event );
			}
		}

		const { onChange } = this.props;
		if ( onChange ) {
			onChange( event );
		}
	}

	_onSelectionChange( event ) {
		if ( this.props.onSelectionChange ) {
			const { selectionStart, selectionEnd, text } = event.nativeEvent;
			const { onSelectionChange } = this.props;
			onSelectionChange( selectionStart, selectionEnd, text, event );
		}

		this.updateCaretData( event );
	}

	updateCaretData( event ) {
		if (
			this.isFocused() &&
			this.selectionEndCaretY !== event?.nativeEvent?.selectionEndCaretY
		) {
			const caretY = event.nativeEvent.selectionEndCaretY;
			AztecInputState.setCurrentCaretData( {
				caretY,
				caretHeight: event.nativeEvent?.selectionEndCaretHeight,
			} );
			this.selectionEndCaretY = caretY;
		}
	}

	blur() {
		AztecInputState.blur( this.aztecViewRef.current );
	}

	focus() {
		AztecInputState.focus( this.aztecViewRef.current );
	}

	isFocused() {
		const focusedElement = AztecInputState.getCurrentFocusedElement();
		return focusedElement && focusedElement === this.aztecViewRef.current;
	}

	onRemoveMarkFormatting() {
		UIManager.dispatchViewManagerCommand(
			findNodeHandle( this.aztecViewRef.current ),
			'onRemoveMarkFormatting',
			[]
		);
	}

	onMarkFormatting( color ) {
		UIManager.dispatchViewManagerCommand(
			findNodeHandle( this.aztecViewRef.current ),
			'onMarkFormatting',
			[ color ]
		);
	}

	_onPress( event ) {
		if ( ! this.isFocused() ) {
			this.focus(); // Call to move the focus in RN way (TextInputState)
			this._onFocus( event ); // Check if there are listeners set on the focus event.
		}
	}

	_onAztecFocus( event ) {
		// IMPORTANT: This function serves two purposes:
		//
		// Android: This intentional no-op function prevents focus loops originating
		// when the native Aztec module programmatically focuses the instance. The
		// no-op is explicitly passed as an `onFocus` prop to avoid future prop
		// spreading from inadvertently introducing focus loops. The user-facing
		// focus of the element is handled by `onPress` instead.
		//
		// See: https://github.com/wordpress-mobile/gutenberg-mobile/issues/302
		//
		// iOS: Programmatic focus from the native Aztec module is required to
		// ensure the React-based `TextStateInput` ref is properly set when focus
		// is *returned* to an instance, e.g. dismissing a bottom sheet. If the ref
		// is not updated, attempts to dismiss the keyboard via the `ToolbarButton`
		// will fail.
		//
		// See: https://github.com/wordpress-mobile/gutenberg-mobile/issues/702
		if (
			// The Android keyboard is, likely erroneously, already dismissed in the
			// contexts where programmatic focus may be required on iOS.
			//
			// - https://github.com/WordPress/gutenberg/issues/28748
			// - https://github.com/WordPress/gutenberg/issues/29048
			// - https://github.com/wordpress-mobile/WordPress-Android/issues/16167
			Platform.OS === 'ios'
		) {
			this.updateCaretData( event );

			if ( ! this.isFocused() ) {
				// Programmatically swapping input focus creates an infinite loop if the
				// user taps a different input in between the programmatic focus and
				// the resulting update to the React Native TextInputState focused element
				// ref. To mitigate this, the below updates the focused element ref, but
				// does not call the native focus methods.
				//
				// See: https://github.com/wordpress-mobile/WordPress-iOS/issues/18783
				AztecInputState.focusInput( this.aztecViewRef.current );

				// Calling _onFocus is needed to trigger provided onFocus callbacks
				// which are needed to prevent undesired results like having a focused
				// TextInput when another element has the focus.
				this._onFocus( event );
			}
		}
	}

	render() {
		const { onActiveFormatsChange, ...otherProps } = this.props;
		// `style` has to be destructured separately, without `otherProps`, because of:
		// https://github.com/WordPress/gutenberg/issues/23611
		const { style } = this.props;

		if ( style.hasOwnProperty( 'lineHeight' ) ) {
			delete style.lineHeight;
			// Prevents passing line-height within styles to avoid a crash due to values without units
			// We now support this but passing line-height as a prop instead.
		}

		// Remove Font size rendering for pre elements until we fix an issue with AztecAndroid.
		if (
			Platform.OS === 'android' &&
			this.props.text?.tag === 'pre' &&
			style.hasOwnProperty( 'fontSize' )
		) {
			delete style.fontSize;
		}

		// We need to use `Pressable` on iOS to avoid issues with VoiceOver and assistive
		// input like the Braille Screen Input.
		// More information about this can be found in https://github.com/WordPress/gutenberg/pull/53895.
		const TouchableComponent =
			Platform.OS === 'ios' ? Pressable : TouchableWithoutFeedback;

		return (
			<TouchableComponent
				accessible={ Platform.OS !== 'ios' }
				onPress={ this._onPress }
			>
				<RCTAztecView
					{ ...otherProps }
					style={ style }
					onContentSizeChange={ this._onContentSizeChange }
					onHTMLContentWithCursor={ this._onHTMLContentWithCursor }
					onChange={ this._onChange }
					onSelectionChange={ this._onSelectionChange }
					onEnter={ this.props.onKeyDown && this._onEnter }
					onBackspace={ this.props.onKeyDown && this._onBackspace }
					onKeyDown={ this.props.onKeyDown && this._onKeyDown }
					deleteEnter={ this.props.deleteEnter }
					// IMPORTANT: Do not remove the `onFocus` prop, see `_onAztecFocus`
					onFocus={ this._onAztecFocus }
					onBlur={ this._onBlur }
					ref={ this.aztecViewRef }
				/>
			</TouchableComponent>
		);
	}
}

const RCTAztecView = requireNativeComponent( 'RCTAztecView', AztecView );

AztecView.InputState = AztecInputState;
AztecView.KeyCodes = KEYCODES;

export default AztecView;
