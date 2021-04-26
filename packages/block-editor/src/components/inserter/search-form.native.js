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
import { useState, useRef, useMemo } from '@wordpress/element';
import { usePreferredColorSchemeStyleBem } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Gridicons } from '@wordpress/components';
import { Icon, cancelCircleFilled, arrowLeft, close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import platformStyles from './searchFormStyles.scss';

function IconButton( { icon, label, hint, style, ...props } ) {
	return (
		<TouchableOpacity
			{ ...props }
			accessible={ true }
			accessibilityRole={ 'button' }
			accessibilityHint={ hint }
			accessibilityLabel={ label }
			style={ { alignItems: 'center' } }
		>
			<Icon icon={ icon } fill={ style?.color } />
		</TouchableOpacity>
	);
}

function InserterSearchForm( { value, onChange, onLayout = () => {} } ) {
	const [ isActive, setIsActive ] = useState( false );

	const isIOS = Platform.OS === 'ios';

	const inputRef = useRef();

	const baseStyles = usePreferredColorSchemeStyleBem(
		styles,
		platformStyles
	);

	const activeStyles = useMemo( () => {
		const activeSelectors = Object.keys( baseStyles ).filter(
			( key ) => !! key.match( /active/ )
		);

		const _activeStyles = { ...styles };

		activeSelectors.forEach( ( activeSelector ) => {
			const selector = activeSelector
				.replace( /-active/, '' )
				.replace( /-$/, '' );

			_activeStyles[ selector ] = {
				...baseStyles[ selector ],
				...baseStyles[ activeSelector ],
			};
		} );
		return _activeStyles;
	}, [] );

	const newStyles = useMemo( () => {
		return isActive ? activeStyles : baseStyles;
	}, [ isActive ] );

	const {
		'inserter-search-form__container': containerStyle,
		'inserter-search-form__input-container': inputContainerStyle,
		'inserter-search-form__form-input': formInputStyle,
		'inserter-search-form__form-input-placeholder': placeholderStyle,
		'inserter-search-form__input-button': inputButtonStyle,
		'inserter-search-form__input-button-left': inputButtonLeftStyle,
		'inserter-search-form__input-button-right': inputButtonRightStyle,
		'inserter-search-form__cancel-button': cancelButtonStyle,
		'inserter-search-form__cancel-button-text': cancelButtonTextStyle,
		'inserter-search-form__icon': iconStyle,
	} = newStyles;

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
					style={ iconStyle }
				/>
			);
		}

		return <Icon icon={ Gridicons.search } fill={ iconStyle.color } />;
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
					style={ iconStyle }
				/>
			);
		}
	}

	return (
		<TouchableOpacity
			style={ containerStyle }
			onPress={ () => {
				setIsActive( true );
				inputRef.current.focus();
			} }
			onLayout={ onLayout }
			activeOpacity={ 1 }
		>
			<View style={ inputContainerStyle }>
				<View
					style={ { ...inputButtonStyle, ...inputButtonLeftStyle } }
				>
					{ renderLeftButton() }
				</View>
				<TextInput
					ref={ inputRef }
					style={ formInputStyle }
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
