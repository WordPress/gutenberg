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
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useModifiedStyles } from '@wordpress/compose';
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
import baseStyles from './style.scss';
import platformStyles from './platform-style.scss';

// Merge platform specific styles
for ( const selector in platformStyles ) {
	baseStyles[ selector ] = {
		...baseStyles[ selector ],
		...platformStyles[ selector ],
	};
}

function SearchControl( {
	value,
	onChange,
	placeholder = __( 'Search Blocks' ),
} ) {
	const [ isActive, setIsActive ] = useState( false );
	const isDark = useColorScheme() === 'dark';
	const inputRef = useRef();
	const isIOS = Platform.OS === 'ios';

	const styles = useModifiedStyles( baseStyles, {
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
		inputRef.current.blur();
		clearInput();
		setIsActive( false );
	}

	function renderLeftButton() {
		const button =
			! isIOS && isActive ? (
				<Button
					label={ __( 'Cancel Search' ) }
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
					label={ __( 'Clear Search' ) }
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
					accessibilityLabel={ __( 'Cancel Search' ) }
					accessibilityHint={ __( 'Cancel Search' ) }
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
