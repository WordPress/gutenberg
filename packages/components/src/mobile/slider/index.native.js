/**
 * External dependencies
 */
import { Slider as RNSlider, TextInput, View } from 'react-native';

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

		this.state = { hasFocus: false, sliderValue: props.value || props.minimumValue };
	}

	componentDidUpdate( ) {
		const reset = this.props.value === null;
		if ( reset ) {
			this.handleChange( this.props.minimumValue );
		}
	}

	handleToggleFocus( validateInput = true ) {
		const newState = { hasFocus: ! this.state.hasFocus };

		if ( validateInput ) {
			newState.sliderValue = this.validateInput( this.state.sliderValue );
		}

		this.setState( newState );
	}

	validateInput( text ) {
		const { minimumValue, maximumValue } = this.props;
		if ( ! text ) {
			return minimumValue;
		}
		if ( typeof text === 'number' ) {
			return text;
		}
		return Math.min( Math.max( text.replace( /[^0-9]/g, '' ).replace( /^0+(?=\d)/, '' ), minimumValue ), maximumValue );
	}

	handleChange( text ) {
		if ( ! isNaN( Number( text ) ) ) {
			this.props.onChangeValue( text );
			this.setState( { sliderValue: text } );
		}
	}

	render() {
		const {
			value,
			minimumValue,
			maximumValue,
			disabled,
			step,
			minimumTrackTintColor,
			maximumTrackTintColor,
			thumbTintColor,
		} = this.props;

		const { hasFocus, sliderValue } = this.state;

		return (
			<View style={ styles.sliderContainer }>
				<RNSlider
					value={ this.validateInput( value ) }
					disabled={ disabled }
					style={ styles.slider }
					step={ step }
					minimumValue={ minimumValue }
					maximumValue={ maximumValue }
					minimumTrackTintColor={ minimumTrackTintColor }
					maximumTrackTintColor={ maximumTrackTintColor }
					thumbTintColor={ thumbTintColor }
					onValueChange={ this.handleChange }
				/>
				<TextInput
					style={ [ styles.sliderTextInput, hasFocus ? styles.isSelected : {} ] }
					onChangeText={ this.handleChange }
					onFocus={ this.handleToggleFocus }
					onBlur={ this.handleToggleFocus }
					keyboardType="numeric"
					value={ `${ sliderValue }` }
				/>
			</View>
		);
	}
}

export default Slider;
