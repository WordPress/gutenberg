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
import styles from './range-cell.scss';
import borderStyles from './borderStyles.scss';

class BottomSheetRangeCell extends Component {
	constructor( props ) {
		super( props );
		this.handleToggleFocus = this.handleToggleFocus.bind( this );
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
		this.handleToggleFocus();
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

	handleToggleFocus() {
		this.setState( ( state ) => ( {
			...state,
			hasFocus: ! state.hasFocus,
		} ) );
	}

	validateInput( text ) {
		const { minimumValue, maximumValue } = this.props;
		if ( ! text ) {
			return minimumValue;
		}
		if ( typeof text === 'number' ) {
			return Math.min( Math.max( text, minimumValue ), maximumValue );
		}
		return Math.min(
			Math.max(
				text.replace( /[^0-9]/g, '' ).replace( /^0+(?=\d)/, '' ),
				minimumValue
			),
			maximumValue
		);
	}

	updateValue( value ) {
		const { onChange } = this.props;
		const validValue = this.validateInput( value );
		this.announceCurrentValue( `${ validValue }` );
		onChange( parseInt( validValue ) );
	}

	onChangeValue( initialValue ) {
		this.setState( { inputValue: initialValue } );
		this.updateValue( initialValue );
	}

	onChangeText( textValue ) {
		const value = this.validateInput( textValue );
		this.setState( { inputValue: textValue, sliderValue: value } );
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
		const validValue = this.validateInput( text );

		if ( this.state.inputValue !== validValue ) {
			this.setState( { inputValue: validValue } );
			this.announceCurrentValue( `${ validValue }` );
			this.props.onChange( parseInt( validValue ) );
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
			maximumTrackTintColor = Platform.OS === 'ios'
				? '#e9eff3'
				: '#909090',
			thumbTintColor = Platform.OS === 'android' && '#00669b',
			getStylesFromColorScheme,
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

		return (
			<Cell
				{ ...cellProps }
				cellContainerStyle={ styles.cellContainerStyles }
				cellRowContainerStyle={ styles.cellRowStyles }
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
				<View style={ styles.container }>
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
						style={ styles.slider }
						accessibilityRole={ 'adjustable' }
					/>
					<TextInput
						style={ [
							defaultSliderStyle,
							borderStyles.borderStyle,
							hasFocus && borderStyles.isSelected,
							{ width: 40 * fontScale },
						] }
						onChangeText={ this.onChangeText }
						onSubmitEditing={ this.onSubmitEditing }
						onFocus={ this.handleToggleFocus }
						onBlur={ this.handleToggleFocus }
						keyboardType="number-pad"
						returnKeyType="done"
						defaultValue={ `${ inputValue }` }
					/>
				</View>
			</Cell>
		);
	}
}

export default withPreferredColorScheme( BottomSheetRangeCell );
