/**
 * External dependencies
 */
import { Slider as RNSlider, TextInput, View, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

class Slider extends Component {
	constructor( props ) {
		super( props );
		this.handleToggleFocus = this.handleToggleFocus.bind( this );
		this.handleChange = this.handleChange.bind( this );
		this.handleValueSave = this.handleValueSave.bind( this );
		this.handleReset = this.handleReset.bind( this );

		const initialValue = this.validateInput( props.value || props.defaultValue || props.minimumValue );

		this.state = { hasFocus: false, initialValue, sliderValue: initialValue };
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

	handleChange( text ) {
		if ( ! isNaN( Number( text ) ) ) {
			this.setState( { sliderValue: text } );
		}
	}

	handleValueSave( text ) {
		if ( ! isNaN( Number( text ) ) ) {
			if ( this.props.onChangeValue ) {
				this.props.onChangeValue( text );
			}
			this.setState( { sliderValue: text } );
		}
	}

	handleReset() {
		this.handleValueSave( this.props.defaultValue || this.state.initialValue );
	}

	render() {
		const {
			minimumValue,
			maximumValue,
			disabled,
			step,
			minimumTrackTintColor,
			maximumTrackTintColor,
			thumbTintColor,
			...sliderProps
		} = this.props;

		const { hasFocus, sliderValue } = this.state;

		return (
			<View style={ styles.sliderContainer } accessible={ Platform.OS === 'android' }>
				<RNSlider
					value={ this.validateInput( sliderValue ) }
					disabled={ disabled }
					style={ styles.slider }
					step={ step }
					minimumValue={ minimumValue }
					maximumValue={ maximumValue }
					minimumTrackTintColor={ minimumTrackTintColor }
					maximumTrackTintColor={ maximumTrackTintColor }
					thumbTintColor={ thumbTintColor }
					onValueChange={ this.handleChange }
					onSlidingComplete={ this.handleValueSave }
					{ ...sliderProps }
				/>
				<TextInput
					style={ [ styles.sliderTextInput, hasFocus ? styles.isSelected : {} ] }
					onChangeText={ this.handleChange }
					onFocus={ this.handleToggleFocus }
					onBlur={ this.handleToggleFocus }
					keyboardType="number-pad"
					returnKeyType="done"
					value={ `${ sliderValue }` }
				/>
			</View>
		);
	}
}

export default Slider;
