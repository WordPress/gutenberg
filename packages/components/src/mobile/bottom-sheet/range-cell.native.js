/**
 * External dependencies
 */
import { Platform, AccessibilityInfo, View } from 'react-native';
import Slider from '@react-native-community/slider';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import Cell from './cell';
import LockIcon from './lock-icon';
import styles from './range-cell.scss';
import RangeTextInput from './range-text-input';
import { toFixed } from '../utils';

const isIOS = Platform.OS === 'ios';

class BottomSheetRangeCell extends Component {
	constructor( props ) {
		super( props );
		this.onSliderChange = this.onSliderChange.bind( this );
		this.onCompleteSliderChange = this.onCompleteSliderChange.bind( this );
		this.onTextInputChange = this.onTextInputChange.bind( this );
		this.a11yIncrementValue = this.a11yIncrementValue.bind( this );
		this.a11yDecrementValue = this.a11yDecrementValue.bind( this );
		this.a11yUpdateValue = this.a11yUpdateValue.bind( this );

		const { value, defaultValue, minimumValue } = props;
		const initialValue = Number( value || defaultValue || minimumValue );

		this.state = {
			inputValue: initialValue,
			sliderValue: initialValue,
		};
	}

	componentWillUnmount() {
		clearTimeout( this.timeoutAnnounceValue );
	}

	onSliderChange( initialValue ) {
		const { decimalNum, onChange } = this.props;
		initialValue = toFixed( initialValue, decimalNum );
		this.setState( { inputValue: initialValue } );
		onChange( initialValue );
	}

	onTextInputChange( nextValue ) {
		const { onChange, onComplete } = this.props;
		this.setState( {
			sliderValue: nextValue,
		} );
		onChange( nextValue );
		if ( onComplete ) {
			onComplete( nextValue );
		}
	}

	onCompleteSliderChange( nextValue ) {
		const { decimalNum, onComplete } = this.props;
		nextValue = toFixed( nextValue, decimalNum );
		if ( onComplete ) {
			onComplete( nextValue );
		}
	}

	/*
	 * Only used with screenreaders like VoiceOver and TalkBack. Increments the
	 * value of this setting programmatically.
	 */
	a11yIncrementValue() {
		const { step = 5, maximumValue, decimalNum } = this.props;
		const { inputValue } = this.state;

		const newValue = toFixed( inputValue + step, decimalNum );

		if ( newValue <= maximumValue || maximumValue === undefined ) {
			this.a11yUpdateValue( newValue );
		}
	}

	/*
	 * Only used with screenreaders like VoiceOver and TalkBack. Decrements the
	 * value of this setting programmatically.
	 */
	a11yDecrementValue() {
		const { step = 5, minimumValue, decimalNum } = this.props;
		const { sliderValue } = this.state;

		const newValue = toFixed( sliderValue - step, decimalNum );

		if ( newValue >= minimumValue ) {
			this.a11yUpdateValue( newValue );
		}
	}

	a11yUpdateValue( newValue ) {
		const { onChange, onComplete } = this.props;
		this.setState( {
			sliderValue: newValue,
			inputValue: newValue,
		} );
		onChange( newValue );
		if ( onComplete ) {
			onComplete( newValue );
		}
		this.announceValue( newValue );
	}

	/*
	 * Only used with screenreaders like VoiceOver and TalkBack.
	 */
	announceValue( value ) {
		const { label, unitLabel = '' } = this.props;

		if ( isIOS ) {
			// On Android it triggers the accessibilityLabel with the value change, but
			// on iOS we need to do this manually.
			clearTimeout( this.timeoutAnnounceValue );
			this.timeoutAnnounceValue = setTimeout( () => {
				AccessibilityInfo.announceForAccessibility(
					`${ value } ${ unitLabel },  ${ label }`
				);
			}, 300 );
		}
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
			preview,
			cellContainerStyle,
			shouldDisplayTextInput = true,
			unitLabel = '',
			settingLabel = 'Value',
			openUnitPicker,
			children,
			decimalNum,
			...cellProps
		} = this.props;

		const { inputValue, sliderValue } = this.state;

		const getAccessibilityHint = () => {
			return openUnitPicker ? __( 'double-tap to change unit' ) : '';
		};

		const getAccessibilityLabel = () => {
			return sprintf(
				/* translators: accessibility text. Inform about current value. 1: Control label. 2: setting label (example: width). 3: Current value. 4: value measurement unit (example: pixels) */
				__( '%1$s. %2$s is %3$s %4$s.' ),
				cellProps.label,
				settingLabel,
				toFixed( value, decimalNum ),
				unitLabel
			);
		};

		const containerStyle = [
			styles.container,
			isIOS ? styles.containerIOS : styles.containerAndroid,
		];

		return (
			<View
				accessible
				accessibilityRole="adjustable"
				accessibilityActions={ [
					{ name: 'increment' },
					{ name: 'decrement' },
					{ name: 'activate' },
				] }
				onAccessibilityAction={ ( event ) => {
					switch ( event.nativeEvent.actionName ) {
						case 'increment':
							this.a11yIncrementValue();
							break;
						case 'decrement':
							this.a11yDecrementValue();
							break;
						case 'activate':
							if ( openUnitPicker ) {
								openUnitPicker();
							}
							break;
					}
				} }
				accessibilityLabel={ getAccessibilityLabel() }
				accessibilityHint={ getAccessibilityHint() }
			>
				<View importantForAccessibility="no-hide-descendants">
					<Cell
						{ ...cellProps }
						cellContainerStyle={ [
							styles.cellContainerStyles,
							cellContainerStyle,
						] }
						cellRowContainerStyle={ containerStyle }
						leftAlign
						editable={ false }
						activeOpacity={ 1 }
						accessible={ false }
						valueStyle={ styles.valueStyle }
						disabled={ disabled }
						showLockIcon={ false }
					>
						<View style={ containerStyle }>
							{ preview }
							<Slider
								testID={ `Slider ${ cellProps.label }` }
								value={ sliderValue }
								defaultValue={ defaultValue }
								disabled={ disabled && ! isIOS }
								step={ step }
								minimumValue={ minimumValue }
								maximumValue={ maximumValue }
								minimumTrackTintColor={ minimumTrackTintColor }
								maximumTrackTintColor={ maximumTrackTintColor }
								thumbTintColor={ thumbTintColor }
								onValueChange={ this.onSliderChange }
								onSlidingComplete={
									this.onCompleteSliderChange
								}
								ref={ ( slider ) => {
									this.sliderRef = slider;
								} }
								style={
									isIOS
										? styles.sliderIOS
										: styles.sliderAndroid
								}
							/>
							{ shouldDisplayTextInput && (
								<RangeTextInput
									label={ cellProps.label }
									onChange={ this.onTextInputChange }
									defaultValue={ `${ inputValue }` }
									value={ inputValue }
									min={ minimumValue }
									max={ maximumValue }
									step={ step }
									decimalNum={ decimalNum }
								>
									{ children }
								</RangeTextInput>
							) }
							{ disabled && <LockIcon /> }
						</View>
					</Cell>
				</View>
			</View>
		);
	}
}

export default withPreferredColorScheme( BottomSheetRangeCell );
