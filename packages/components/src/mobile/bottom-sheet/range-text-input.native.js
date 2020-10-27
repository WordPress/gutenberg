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
		const initialValue = this.validateInput(
			props.value || props.defaultValue || props.min
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
		AppState.addEventListener( 'change', this.handleChangePixelRatio );
	}

	componentWillUnmount() {
		AppState.removeEventListener( 'change', this.handleChangePixelRatio );
		clearTimeout( this.timeoutAnnounceValue );
	}

	componentDidUpdate( prevProps, prevState ) {
		if ( prevProps.value !== this.props.value ) {
			this.setState( { inputValue: this.props.value } );
		}

		if ( prevState.hasFocus !== this.state.hasFocus ) {
			const validValue = this.validateInput( this.state.inputValue );
			this.setState( { inputValue: validValue } );
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
		this.onChangeText( '' + this.state.inputValue );
		this.setState( {
			hasFocus: false,
		} );
	}

	validateInput( text ) {
		const { min, max, decimalNum } = this.props;
		if ( ! text ) {
			return min;
		}
		if ( typeof text === 'number' ) {
			if ( max ) {
				return Math.min( Math.max( text, min ), max );
			}
			return Math.max( text, min );
		}
		if ( max ) {
			return Math.min(
				Math.max( removeNonDigit( text, decimalNum ), min ),
				max
			);
		}
		return Math.max( removeNonDigit( text, decimalNum ), min );
	}

	updateValue( value ) {
		const { onChange } = this.props;
		const validValue = this.validateInput( value );

		this.announceCurrentValue( `${ validValue }` );

		onChange( validValue );
	}

	onChangeValue( initialValue ) {
		const { decimalNum } = this.props;
		initialValue = toFixed( initialValue, decimalNum );
		this.setState( { inputValue: initialValue } );
		this.updateValue( initialValue );
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
		if ( ! isNaN( Number( text ) ) ) {
			text = toFixed( text.replace( ',', '.' ), decimalNum );
			const validValue = this.validateInput( text );

			if ( this.state.inputValue !== validValue ) {
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
		const { getStylesFromColorScheme, children } = this.props;
		const { fontScale, inputValue, hasFocus } = this.state;

		const textInputStyle = getStylesFromColorScheme(
			styles.textInput,
			styles.textInputDark
		);

		const verticalBorderStyle = getStylesFromColorScheme(
			styles.verticalBorder,
			styles.verticalBorderDark
		);

		const inputBorderStyles = [
			textInputStyle,
			borderStyles.borderStyle,
			hasFocus && borderStyles.isSelected,
		];

		return (
			<View style={ [ styles.rowContainer, isIOS && inputBorderStyles ] }>
				<TextInput
					style={ [
						! isIOS ? inputBorderStyles : verticalBorderStyle,
						{
							width: 40 * fontScale,
						},
					] }
					onChangeText={ this.onChangeText }
					onSubmitEditing={ this.onSubmitEditing }
					onFocus={ this.onInputFocus }
					onBlur={ this.onInputBlur }
					keyboardType="numeric"
					returnKeyType="done"
					defaultValue={ `${ inputValue }` }
					value={ inputValue }
				/>
				{ children }
			</View>
		);
	}
}

export default withPreferredColorScheme( RangeTextInput );
