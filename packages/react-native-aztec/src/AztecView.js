/**
 * External dependencies
 */
import {
	requireNativeComponent,
	UIManager,
	TouchableWithoutFeedback,
	Platform,
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

		if (
			this.props.onCaretVerticalPositionChange &&
			this.selectionEndCaretY !== event.nativeEvent.selectionEndCaretY
		) {
			const caretY = event.nativeEvent.selectionEndCaretY;
			this.props.onCaretVerticalPositionChange(
				event.nativeEvent.target,
				caretY,
				this.selectionEndCaretY
			);
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

	_onPress( event ) {
		if ( ! this.isFocused() ) {
			this.focus(); // Call to move the focus in RN way (TextInputState)
			this._onFocus( event ); // Check if there are listeners set on the focus event.
		}
	}

	_onAztecFocus( event ) {
		// IMPORTANT: the onFocus events from Aztec are thrown away on Android as these are handled by onPress() in the upper level.
		// It's necessary to do this otherwise onFocus may be set by `{...otherProps}` and thus the onPress + onFocus
		// combination generate an infinite loop as described in https://github.com/wordpress-mobile/gutenberg-mobile/issues/302
		// For iOS, this is necessary to let the system know when Aztec was focused programatically.
		if ( Platform.OS === 'ios' ) {
			this._onPress( event );
		}
	}

	render() {
		const { onActiveFormatsChange, ...otherProps } = this.props;
		// `style` has to be destructured separately, without `otherProps`, because of:
		// https://github.com/WordPress/gutenberg/issues/23611
		const { style } = this.props;

		if ( style.hasOwnProperty( 'lineHeight' ) ) {
			delete style.lineHeight;
			window.console.warn(
				"Removing lineHeight style as it's not supported by native AztecView"
			);
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

		return (
			<TouchableWithoutFeedback onPress={ this._onPress }>
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
					// IMPORTANT: the onFocus events are thrown away as these are handled by onPress() in the upper level.
					// It's necessary to do this otherwise onFocus may be set by `{...otherProps}` and thus the onPress + onFocus
					// combination generate an infinite loop as described in https://github.com/wordpress-mobile/gutenberg-mobile/issues/302
					onFocus={ this._onAztecFocus }
					onBlur={ this._onBlur }
					ref={ this.aztecViewRef }
				/>
			</TouchableWithoutFeedback>
		);
	}
}

const RCTAztecView = requireNativeComponent( 'RCTAztecView', AztecView );

AztecView.InputState = AztecInputState;
AztecView.KeyCodes = KEYCODES;

export default AztecView;
