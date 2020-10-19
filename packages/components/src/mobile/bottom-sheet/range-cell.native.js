/**
 * External dependencies
 */
import {
	Platform,
	AccessibilityInfo,
	findNodeHandle,
	TextInput,
	View,
	PixelRatio,
	AppState,
} from 'react-native';
import Slider from '@react-native-community/slider';

/**
 * WordPress dependencies
 */
import { _x, __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Cell from './cell';
import { toFixed, removeNonDigit } from '../utils';
import styles from './range-cell.scss';
import borderStyles from './borderStyles.scss';

const isIOS = Platform.OS === 'ios';

class BottomSheetRangeCell extends Component {
	constructor( props ) {
		super( props );
		this.onInputFocus = this.onInputFocus.bind( this );
		this.onInputBlur = this.onInputBlur.bind( this );
		this.onChangeValue = this.onChangeValue.bind( this );
		this.onCellPress = this.onCellPress.bind( this );
		this.handleChangePixelRatio = this.handleChangePixelRatio.bind( this );
		this.onSubmitEditing = this.onSubmitEditing.bind( this );
		this.onChangeText = this.onChangeText.bind( this );
		const initialValue = this.validateInput(
			props.value || props.defaultValue || props.minimumValue
		);
		const fontScale = this.getFontScale();

		this.state = {
			accessible: true,
			hasFocus: false,
			fontScale,
			inputValue: initialValue,
			sliderValue: initialValue,
		};
	}

	componentDidMount() {
		AppState.addEventListener( 'change', this.handleChangePixelRatio );
	}

	componentWillUnmount() {
		AppState.removeEventListener( 'change', this.handleChangePixelRatio );
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
		this.onChangeText( '' + this.state.sliderValue );
		this.setState( {
			hasFocus: false,
		} );
	}

	validateInput( text ) {
		const { minimumValue, maximumValue, decimalNum } = this.props;
		if ( ! text ) {
			return minimumValue;
		}
		if ( typeof text === 'number' ) {
			return Math.min( Math.max( text, minimumValue ), maximumValue );
		}
		return Math.min(
			Math.max( removeNonDigit( text, decimalNum ), minimumValue ),
			maximumValue
		);
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
			sliderValue: value,
		} );
		this.updateValue( value );
	}

	onCellPress() {
		this.setState( { accessible: false } );
		if ( this.sliderRef ) {
			const reactTag = findNodeHandle( this.sliderRef );
			AccessibilityInfo.setAccessibilityFocus( reactTag );
		}
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
		const {
			value,
			defaultValue,
			minimumValue = 0,
			maximumValue = 10,
			disabled,
			step = 1,
			preferredColorScheme,
			minimumTrackTintColor = preferredColorScheme === 'light'
				? '#00669b'
				: '#5198d9',
			maximumTrackTintColor = isIOS ? '#e9eff3' : '#909090',
			thumbTintColor = ! isIOS && '#00669b',
			getStylesFromColorScheme,
			rangePreview,
			cellContainerStyle,
			shouldDisplayTextInput = true,
			...cellProps
		} = this.props;

		const {
			hasFocus,
			accessible,
			fontScale,
			inputValue,
			sliderValue,
		} = this.state;

		const accessibilityLabel = sprintf(
			/* translators: accessibility text. Inform about current value. %1$s: Control label %2$s: Current value. */
			_x(
				'%1$s. Current value is %2$s',
				'Slider for picking a number inside a range'
			),
			cellProps.label,
			value
		);

		const defaultSliderStyle = getStylesFromColorScheme(
			styles.sliderTextInput,
			styles.sliderDarkTextInput
		);

		const containerStyle = [
			styles.container,
			isIOS ? styles.containerIOS : styles.containerAndroid,
		];

		return (
			<Cell
				{ ...cellProps }
				cellContainerStyle={ [
					styles.cellContainerStyles,
					cellContainerStyle,
				] }
				cellRowContainerStyle={ containerStyle }
				accessibilityRole={ 'none' }
				value={ '' }
				editable={ false }
				activeOpacity={ 1 }
				accessible={ accessible }
				onPress={ this.onCellPress }
				accessibilityLabel={ accessibilityLabel }
				accessibilityHint={
					/* translators: accessibility text (hint for focusing a slider) */
					__( 'Double tap to change the value using slider' )
				}
			>
				<View style={ containerStyle }>
					{ rangePreview }
					<Slider
						value={ this.validateInput( sliderValue ) }
						defaultValue={ defaultValue }
						disabled={ disabled }
						step={ step }
						minimumValue={ minimumValue }
						maximumValue={ maximumValue }
						minimumTrackTintColor={ minimumTrackTintColor }
						maximumTrackTintColor={ maximumTrackTintColor }
						thumbTintColor={ thumbTintColor }
						onValueChange={ this.onChangeValue }
						ref={ ( slider ) => {
							this.sliderRef = slider;
						} }
						style={
							isIOS ? styles.sliderIOS : styles.sliderAndroid
						}
						accessibilityRole={ 'adjustable' }
					/>
					{ shouldDisplayTextInput && (
						<TextInput
							style={ [
								defaultSliderStyle,
								borderStyles.borderStyle,
								hasFocus && borderStyles.isSelected,
								{ width: 40 * fontScale },
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
					) }
				</View>
			</Cell>
		);
	}
}

export default withPreferredColorScheme( BottomSheetRangeCell );
