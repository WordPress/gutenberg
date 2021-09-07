/**
 * External dependencies
 */
import {
	TextInput,
	Text,
	View,
	TouchableOpacity,
	Platform,
	useColorScheme,
	Keyboard,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
import { useModifiedStyle } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Button, Gridicons } from '@wordpress/components';
import {
	Icon,
	cancelCircleFilled as cancelCircleFilledIcon,
	arrowLeft as arrowLeftIcon,
	close as closeIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import allStyles from './style.scss';
import platformStyles from './platform-style.scss';

// Merge platform specific styles with the default styles.
const baseStyles = { ...allStyles };
for ( const selector in platformStyles ) {
	baseStyles[ selector ] = {
		...baseStyles[ selector ],
		...platformStyles[ selector ],
	};
}

function SearchControl( {
	value,
	onChange,
	placeholder = __( 'Search blocks' ),
} ) {
	const [ isActive, setIsActive ] = useState( false );
	const isDark = useColorScheme() === 'dark';
	const inputRef = useRef();
	const onCancelTimer = useRef();

	const isIOS = Platform.OS === 'ios';

	useEffect( () => {
		const keyboardHideSubscription = Keyboard.addListener(
			'keyboardDidHide',
			() => {
				if ( ! isIOS ) {
					onCancel();
				}
			}
		);
		return () => {
			clearTimeout( onCancelTimer.current );
			keyboardHideSubscription.remove();
		};
	}, [] );

	const styles = useModifiedStyle( baseStyles, {
		active: [ isActive ],
		dark: [ isDark ],
		'active-dark': [ isActive, isDark ],
	} );

	const {
		'search-control__container': containerStyle,
		'search-control__inner-container': innerContainerStyle,
		'search-control__input-container': inputContainerStyle,
		'search-control__form-input': formInputStyle,
		'search-control__form-input-placeholder': placeholderStyle,
		'search-control__input-button': inputButtonStyle,
		'search-control__input-button-left': inputButtonLeftStyle,
		'search-control__input-button-right': inputButtonRightStyle,
		'search-control__cancel-button': cancelButtonStyle,
		'search-control__cancel-button-text': cancelButtonTextStyle,
		'search-control__icon': iconStyle,
		'search-control__right-icon': rightIconStyle,
	} = styles;

	function clearInput() {
		onChange( '' );
	}

	function onCancel() {
		onCancelTimer.current = setTimeout( () => {
			inputRef.current.blur();
			clearInput();
			setIsActive( false );
		}, 0 );
	}

	function renderLeftButton() {
		const button =
			! isIOS && isActive ? (
				<Button
					label={ __( 'Cancel search' ) }
					icon={ arrowLeftIcon }
					onClick={ onCancel }
					style={ iconStyle }
				/>
			) : (
				<Icon icon={ Gridicons.search } fill={ iconStyle?.color } />
			);

		return (
			<View style={ [ inputButtonStyle, inputButtonLeftStyle ] }>
				{ button }
			</View>
		);
	}

	function renderRightButton() {
		let button;

		// Add a View element to properly center the input placeholder via flexbox.
		if ( isIOS && ! isActive ) {
			button = <View />;
		}

		if ( !! value ) {
			button = (
				<Button
					label={ __( 'Clear search' ) }
					icon={ isIOS ? cancelCircleFilledIcon : closeIcon }
					onClick={ clearInput }
					style={ [ iconStyle, rightIconStyle ] }
				/>
			);
		}

		return (
			<View style={ [ inputButtonStyle, inputButtonRightStyle ] }>
				{ button }
			</View>
		);
	}

	function renderCancel() {
		if ( ! isIOS ) {
			return null;
		}
		return (
			<View style={ cancelButtonStyle }>
				<Text
					onPress={ onCancel }
					style={ cancelButtonTextStyle }
					accessible={ true }
					accessibilityRole={ 'button' }
					accessibilityLabel={ __( 'Cancel search' ) }
					accessibilityHint={ __( 'Cancel search' ) }
				>
					{ __( 'Cancel' ) }
				</Text>
			</View>
		);
	}

	return (
		<TouchableOpacity
			style={ containerStyle }
			onPress={ () => {
				setIsActive( true );
				inputRef.current.focus();
			} }
			activeOpacity={ 1 }
		>
			<View style={ innerContainerStyle }>
				<View style={ inputContainerStyle }>
					{ renderLeftButton() }
					<TextInput
						ref={ inputRef }
						style={ formInputStyle }
						placeholderTextColor={ placeholderStyle?.color }
						onChangeText={ onChange }
						onFocus={ () => setIsActive( true ) }
						value={ value }
						placeholder={ placeholder }
					/>
					{ renderRightButton() }
				</View>
				{ isActive && renderCancel() }
			</View>
		</TouchableOpacity>
	);
}

export default SearchControl;
