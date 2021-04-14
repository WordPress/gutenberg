/**
 * External dependencies
 */
import {
	TextInput,
	Text,
	View,
	Platform,
	TouchableOpacity,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Gridicons } from '@wordpress/components';
import { Icon, cancelCircleFilled, arrowLeft, close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import platformStyles from './searchFormStyles.scss';

function IconButton( { icon, label, hint, ...props } ) {
	return (
		<TouchableOpacity
			{ ...props }
			accessible={ true }
			accessibilityRole={ 'button' }
			accessibilityHint={ hint }
			accessibilityLabel={ label }
		>
			<Icon icon={ icon } />
		</TouchableOpacity>
	);
}

function InserterSearchForm( { value, onChange, onLayout = () => {} } ) {
	const [ isActive, setIsActive ] = useState( false );

	const isIOS = Platform.OS === 'ios';

	const inputRef = useRef();

	const containerStyle = {
		...usePreferredColorSchemeStyle(
			styles[ 'inserter-search-form__container' ],
			styles[ 'inserter-search-form__container--dark' ]
		),
		...usePreferredColorSchemeStyle(
			platformStyles[ 'inserter-search-form__container' ],
			platformStyles[ 'inserter-search-form__container--dark' ]
		),
	};

	const containerActiveStyle = {
		...containerStyle,
		...usePreferredColorSchemeStyle(
			styles[ 'inserter-search-form__container--active' ],
			styles[ 'inserter-search-form__container--active-dark' ]
		),
		...usePreferredColorSchemeStyle(
			platformStyles[ 'inserter-search-form__container--active' ],
			platformStyles[ 'inserter-search-form__container--active-dark' ]
		),
	};

	const inputContainerStyle = {
		...usePreferredColorSchemeStyle(
			styles[ 'inserter-search-form__input-container' ],
			styles[ 'inserter-search-form__input-container--dark' ]
		),
		...usePreferredColorSchemeStyle(
			platformStyles[ 'inserter-search-form__input-container' ],
			platformStyles[ 'inserter-search-form__input-container--dark' ]
		),
	};

	const inputContainerActiveStyle = {
		...inputContainerStyle,
		...usePreferredColorSchemeStyle(
			styles[ 'inserter-search-form__input-container--active' ],
			styles[ 'inserter-search-form__input-container--active-dark' ]
		),
		...usePreferredColorSchemeStyle(
			platformStyles[ 'inserter-search-form__input-container--active' ],
			platformStyles[
				'inserter-search-form__input-container--active-dark'
			]
		),
	};

	const formInputStyle = {
		...usePreferredColorSchemeStyle(
			styles[ 'inserter-search-form__form-input' ],
			styles[ 'inserter-search-form__form-input--dark' ]
		),
		...usePreferredColorSchemeStyle(
			platformStyles[ 'inserter-search-form__form-input' ],
			platformStyles[ 'inserter-search-form__form-input--dark' ]
		),
	};

	const formInputActiveStyle = {
		...formInputStyle,
		...usePreferredColorSchemeStyle(
			styles[ 'inserter-search-form__form-input--active' ],
			styles[ 'inserter-search-form__form-input--active-dark' ]
		),
		...usePreferredColorSchemeStyle(
			platformStyles[ 'inserter-search-form__form-input--active' ],
			platformStyles[ 'inserter-search-form__form-input--active-dark' ]
		),
	};

	const placeholderStyle = {
		...usePreferredColorSchemeStyle(
			styles[ 'inserter-search-form__placeholder' ],
			styles[ 'inserter-search-form__placeholder--dark' ]
		),
		...usePreferredColorSchemeStyle(
			platformStyles[ 'inserter-search-form__placeholder' ],
			platformStyles[ 'inserter-search-form__placeholder--dark' ]
		),
	};

	const baseInputButtonStyle = {
		...usePreferredColorSchemeStyle(
			styles[ 'inserter-search-form__input-button' ],
			styles[ 'inserter-search-form__input-button--dark' ]
		),
		...usePreferredColorSchemeStyle(
			platformStyles[ 'inserter-search-form__input-button' ],
			platformStyles[ 'inserter-search-form__input-button--dark' ]
		),
	};

	const activeInputButtonStyle = {
		...baseInputButtonStyle,
		...usePreferredColorSchemeStyle(
			styles[ 'inserter-search-form__input-button--active' ],
			styles[ 'inserter-search-form__input-button--active-dark' ]
		),
		...usePreferredColorSchemeStyle(
			platformStyles[ 'inserter-search-form__input-button--active' ],
			platformStyles[ 'inserter-search-form__input-button--active-dark' ]
		),
	};

	const inputButtonStyle = isActive
		? activeInputButtonStyle
		: baseInputButtonStyle;

	const baseInputButtonLeftStyle = {
		...styles[ 'inserter-search-form__input-button-left' ],
		...platformStyles[ 'inserter-search-form__input-button-left' ],
	};

	const activeInputButtonLeftStyle = {
		...styles[ 'inserter-search-form__input-button-left--active' ],
		...platformStyles[ 'inserter-search-form__input-button-left--active' ],
	};

	const inputButtonLeftStyle = isActive
		? activeInputButtonLeftStyle
		: baseInputButtonLeftStyle;

	const inputButtonRightStyle = {
		...styles[ 'inserter-search-form__input-button-right' ],
		...platformStyles[ 'inserter-search-form__input-button-right' ],
	};

	const cancelButtonStyle = {
		...usePreferredColorSchemeStyle(
			styles[ 'inserter-search-form__cancel-button' ],
			styles[ 'inserter-search-form__cancel-button--dark' ]
		),
		...usePreferredColorSchemeStyle(
			platformStyles[ 'inserter-search-form__cancel-button' ],
			platformStyles[ 'inserter-search-form__cancel-button--dark' ]
		),
	};

	const cancelButtonTextStyle = {
		...usePreferredColorSchemeStyle(
			styles[ 'inserter-search-form__cancel-button-text' ],
			styles[ 'inserter-search-form__cancel-button-text--dark' ]
		),
		...usePreferredColorSchemeStyle(
			platformStyles[ 'inserter-search-form__cancel-button-text' ],
			platformStyles[ 'inserter-search-form__cancel-button-text--dark' ]
		),
	};

	function clearInput() {
		onChange( '' );
	}

	function onCancel() {
		inputRef.current.blur();
		clearInput();
		setIsActive( false );
	}

	function renderLeftButton() {
		if ( ! isIOS && isActive ) {
			return (
				<IconButton
					label={ __( 'Cancel Search' ) }
					icon={ arrowLeft }
					onPress={ onCancel }
				/>
			);
		}

		return <Icon icon={ Gridicons.search } />;
	}

	function renderRightButton() {
		// Add a View element to properly center the input placeholder via flexbox
		if ( isIOS && ! isActive ) {
			return <View />;
		}

		if ( !! value ) {
			return (
				<IconButton
					label={ __( 'Clear search' ) }
					icon={ isIOS ? cancelCircleFilled : close }
					onPress={ clearInput }
				/>
			);
		}
	}

	return (
		<TouchableOpacity
			style={ isActive ? containerActiveStyle : containerStyle }
			onPress={ () => {
				setIsActive( true );
				inputRef.current.focus();
			} }
			onLayout={ onLayout }
			activeOpacity={ isActive ? 1 : 0.2 }
		>
			<View
				style={
					isActive ? inputContainerActiveStyle : inputContainerStyle
				}
			>
				<View
					style={ { ...inputButtonStyle, ...inputButtonLeftStyle } }
				>
					{ renderLeftButton() }
				</View>
				<TextInput
					ref={ inputRef }
					style={ isActive ? formInputActiveStyle : formInputStyle }
					placeholderTextColor={ placeholderStyle.color }
					onChangeText={ onChange }
					onFocus={ () => setIsActive( true ) }
					value={ value }
					placeholder={ __( 'Search blocks' ) }
				/>
				<View
					style={ { ...inputButtonStyle, ...inputButtonRightStyle } }
				>
					{ renderRightButton() }
				</View>
			</View>
			{ isActive && isIOS && (
				<View style={ cancelButtonStyle }>
					<Text
						onPress={ onCancel }
						style={ cancelButtonTextStyle }
						accessible={ true }
						accessibilityRole={ 'button' }
						accessibilityLabel={ __( 'Cancel Search' ) }
					>
						{ __( 'Cancel' ) }
					</Text>
				</View>
			) }
		</TouchableOpacity>
	);
}

export default InserterSearchForm;
