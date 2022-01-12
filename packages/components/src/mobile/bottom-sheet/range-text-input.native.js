/**
 * External dependencies
 */
import {
	AccessibilityInfo,
	View,
	TextInput,
	PixelRatio,
	AppState,
	Platform,
	Text,
	TouchableWithoutFeedback,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { toFixed, removeNonDigit } from '../utils';
import styles from './styles.scss';
import borderStyles from './borderStyles.scss';

const isIOS = Platform.OS === 'ios';

class RangeTextInput extends Component {
	constructor( props ) {
		super( props );

		this.announceCurrentValue = this.announceCurrentValue.bind( this );
		this.onInputFocus = this.onInputFocus.bind( this );
		this.onInputBlur = this.onInputBlur.bind( this );
		this.handleChangePixelRatio = this.handleChangePixelRatio.bind( this );
		this.onSubmitEditing = this.onSubmitEditing.bind( this );
		this.onChangeText = this.onChangeText.bind( this );

		const { value, defaultValue, min, decimalNum } = props;
		const initialValue = toFixed(
			value || defaultValue || min,
			decimalNum
		);

		const fontScale = this.getFontScale();

		this.state = {
			fontScale,
			inputValue: initialValue,
			controlValue: initialValue,
			hasFocus: false,
		};
	}

	componentDidMount() {
		this.appStateChangeSubscription = AppState.addEventListener(
			'change',
			this.handleChangePixelRatio
		);
	}

	componentWillUnmount() {
		this.appStateChangeSubscription.remove();
		clearTimeout( this.timeoutAnnounceValue );
	}

	componentDidUpdate( prevProps, prevState ) {
		const { value } = this.props;
		const { hasFocus, inputValue } = this.state;

		if ( prevProps.value !== value ) {
			this.setState( { inputValue: value } );
		}

		if ( prevState.hasFocus !== hasFocus ) {
			const validValue = this.validateInput( inputValue );
			this.setState( { inputValue: validValue } );
		}

		if ( ! prevState.hasFocus && hasFocus ) {
			this._valueTextInput.focus();
		}
	}

	getFontScale() {
		return PixelRatio.getFontScale() < 1 ? 1 : PixelRatio.getFontScale();
	}

	handleChangePixelRatio( nextAppState ) {
		if ( nextAppState === 'active' ) {
			this.setState( { fontScale: this.getFontScale() } );
		}
	}

	onInputFocus() {
		this.setState( {
			hasFocus: true,
		} );
	}

	onInputBlur() {
		const { inputValue } = this.state;
		this.onChangeText( `${ inputValue }` );
		this.setState( {
			hasFocus: false,
		} );
	}

	validateInput( text ) {
		const { min, max, decimalNum } = this.props;
		let result = min;
		if ( ! text ) {
			return min;
		}

		if ( typeof text === 'number' ) {
			result = Math.max( text, min );
			return max ? Math.min( result, max ) : result;
		}

		result = Math.max( removeNonDigit( text, decimalNum ), min );
		return max ? Math.min( result, max ) : result;
	}

	updateValue( value ) {
		const { onChange } = this.props;
		const validValue = this.validateInput( value );

		this.announceCurrentValue( `${ validValue }` );

		onChange( validValue );
	}

	onChangeText( textValue ) {
		const { decimalNum } = this.props;
		const inputValue = removeNonDigit( textValue, decimalNum );

		textValue = inputValue.replace( ',', '.' );
		textValue = toFixed( textValue, decimalNum );
		const value = this.validateInput( textValue );
		this.setState( {
			inputValue,
			controlValue: value,
		} );
		this.updateValue( value );
	}

	onSubmitEditing( { nativeEvent: { text } } ) {
		const { decimalNum } = this.props;
		const { inputValue } = this.state;

		if ( ! isNaN( Number( text ) ) ) {
			text = toFixed( text.replace( ',', '.' ), decimalNum );
			const validValue = this.validateInput( text );

			if ( inputValue !== validValue ) {
				this.setState( { inputValue: validValue } );
				this.announceCurrentValue( `${ validValue }` );
				this.props.onChange( validValue );
			}
		}
	}

	announceCurrentValue( value ) {
		/* translators: %s: current cell value. */
		const announcement = sprintf( __( 'Current value is %s' ), value );
		AccessibilityInfo.announceForAccessibility( announcement );
	}

	render() {
		const { getStylesFromColorScheme, children, label } = this.props;
		const { fontScale, inputValue, hasFocus } = this.state;

		const textInputStyle = getStylesFromColorScheme(
			styles.textInput,
			styles.textInputDark
		);

		const textInputIOSStyle = getStylesFromColorScheme(
			styles.textInputIOS,
			styles.textInputIOSDark
		);

		const inputBorderStyles = [
			textInputStyle,
			borderStyles.borderStyle,
			hasFocus && borderStyles.isSelected,
		];

		const valueFinalStyle = [
			Platform.select( {
				android: inputBorderStyles,
				ios: textInputIOSStyle,
			} ),
			{
				width: 50 * fontScale,
				borderRightWidth: children ? 1 : 0,
			},
		];

		return (
			<TouchableWithoutFeedback
				onPress={ this.onInputFocus }
				accessible={ false }
			>
				<View
					style={ [
						styles.textInputContainer,
						isIOS && inputBorderStyles,
					] }
					accessible={ false }
				>
					{ isIOS || hasFocus ? (
						<TextInput
							accessibilityLabel={ label }
							ref={ ( c ) => ( this._valueTextInput = c ) }
							style={ valueFinalStyle }
							onChangeText={ this.onChangeText }
							onSubmitEditing={ this.onSubmitEditing }
							onFocus={ this.onInputFocus }
							onBlur={ this.onInputBlur }
							keyboardType="numeric"
							returnKeyType="done"
							numberOfLines={ 1 }
							defaultValue={ `${ inputValue }` }
							value={ inputValue.toString() }
							pointerEvents={ hasFocus ? 'auto' : 'none' }
						/>
					) : (
						<Text
							style={ valueFinalStyle }
							numberOfLines={ 1 }
							ellipsizeMode="clip"
						>
							{ inputValue }
						</Text>
					) }
					{ children }
				</View>
			</TouchableWithoutFeedback>
		);
	}
}

export default withPreferredColorScheme( RangeTextInput );
