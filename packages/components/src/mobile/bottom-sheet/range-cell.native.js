/**
 * External dependencies
 */
import { Platform, AccessibilityInfo, findNodeHandle, TextInput, Slider, View } from 'react-native';

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
		this.handleChange = this.handleChange.bind( this );
		this.handleValueSave = this.handleValueSave.bind( this );
		this.handleReset = this.handleReset.bind( this );
		this.onChangeValue = this.onChangeValue.bind( this );
		this.onCellPress = this.onCellPress.bind( this );

		const initialValue = this.validateInput( props.value || props.defaultValue || props.minimumValue );

		this.state = { accessible: true, sliderValue: initialValue, initialValue, hasFocus: false };
	}

	componentDidUpdate( ) {
		const reset = this.props.value === null;
		if ( reset ) {
			this.handleReset();
		}
	}

	componentWillUnmount() {
		this.handleToggleFocus();
	}

	handleChange( text ) {
		if ( ! isNaN( Number( text ) ) ) {
			this.setState( { sliderValue: text } );
			this.announceCurrentValue( text );
		}
	}

	handleReset() {
		this.handleValueSave( this.props.defaultValue || this.state.initialValue );
	}

	handleToggleFocus( validateInput = true ) {
		const newState = { hasFocus: ! this.state.hasFocus };

		if ( validateInput ) {
			const sliderValue = this.validateInput( this.state.sliderValue );
			this.handleValueSave( sliderValue );
		}

		this.setState( newState );
	}

	validateInput( text ) {
		const { minimumValue, maximumValue } = this.props;
		if ( ! text ) {
			return minimumValue;
		}
		if ( typeof text === 'number' ) {
			return Math.min( Math.max( text, minimumValue ), maximumValue );
		}
		return Math.min( Math.max( text.replace( /[^0-9]/g, '' ).replace( /^0+(?=\d)/, '' ), minimumValue ), maximumValue );
	}

	handleValueSave( text ) {
		if ( ! isNaN( Number( text ) ) ) {
			this.onChangeValue( text );
			this.setState( { sliderValue: text } );
			this.announceCurrentValue( text );
		}
	}

	onChangeValue( initialValue ) {
		const { minimumValue, maximumValue, onChange } = this.props;

		let sliderValue = initialValue;
		if ( sliderValue < minimumValue ) {
			sliderValue = minimumValue;
		} else if ( sliderValue > maximumValue ) {
			sliderValue = maximumValue;
		}
		onChange( sliderValue );
	}

	onCellPress() {
		this.setState( { accessible: false } );
		if ( this.sliderRef ) {
			const reactTag = findNodeHandle( this.sliderRef );
			AccessibilityInfo.setAccessibilityFocus( reactTag );
		}
	}

	announceCurrentValue( value ) {
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
			minimumTrackTintColor = preferredColorScheme === 'light' ? '#00669b' : '#5198d9',
			maximumTrackTintColor = Platform.OS === 'ios' ? '#e9eff3' : '#909090',
			thumbTintColor = Platform.OS === 'android' && '#00669b',
			getStylesFromColorScheme,
			allowReset,
			...cellProps
		} = this.props;

		const { hasFocus, sliderValue, accessible } = this.state;

		const accessibilityLabel =
		sprintf(
			/* translators: accessibility text. Inform about current value. %1$s: Control label %2$s: Current value. */
			_x( '%1$s. Current value is %2$s', 'Slider for picking a number inside a range' ),
			cellProps.label, value
		);

		const defaultSliderStyle = getStylesFromColorScheme( styles.sliderTextInput, styles.sliderDarkTextInput );

		return (
			<Cell
				{ ...cellProps }
				cellContainerStyle={ styles.cellContainerStyles }
				cellRowContainerStyle={ styles.cellRowStyles }
				accessibilityRole={ 'none' }
				editable={ false }
				accessible={ accessible }
				onPress={ this.onCellPress }
				accessibilityLabel={ accessibilityLabel }
				onReset={ allowReset ? this.handleReset : undefined }
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
						onValueChange={ this.handleChange }
						onSlidingComplete={ this.handleValueSave }
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
						] }
						onChangeText={ this.handleChange }
						onFocus={ this.handleToggleFocus }
						onBlur={ this.handleToggleFocus }
						keyboardType="number-pad"
						returnKeyType="done"
						value={ `${ sliderValue }` }
					/>
				</View>
			</Cell>
		);
	}
}

export default withPreferredColorScheme( BottomSheetRangeCell );
