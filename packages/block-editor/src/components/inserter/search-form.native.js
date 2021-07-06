/**
 * External dependencies
 */
import {
	TextInput,
	Text,
	View,
	TouchableOpacity,
	Platform,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useRef, useMemo } from '@wordpress/element';
import { usePreferredColorScheme } from '@wordpress/compose';
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
import baseStyles from './style.scss';
import platformStyles from './searchFormStyles.scss';

// Merge platform specific styles
for ( const selector in platformStyles ) {
	baseStyles[ selector ] = {
		...baseStyles[ selector ],
		...platformStyles[ selector ],
	};
}

function usePreferredColorSchemeBemStyle( styles, darkModifier = 'dark' ) {
	const colorScheme = usePreferredColorScheme();

	if ( colorScheme !== 'dark' ) {
		return styles;
	}

	const darkSelectors = Object.keys( styles ).filter( ( selector ) =>
		selector.match( `--${ darkModifier }$` )
	);

	darkSelectors.forEach( ( darkSelector ) => {
		const baseSelector = darkSelector.replace( `--${ darkModifier }`, '' );

		styles[ baseSelector ] = {
			...styles[ baseSelector ],
			...styles[ darkSelector ],
		};
	} );

	return styles;
}

function InserterSearchForm( { value, onChange } ) {
	const [ isActive, setIsActive ] = useState( false );

	const inputRef = useRef();

	const isIOS = Platform.OS === 'ios';

	const themedStyles = usePreferredColorSchemeBemStyle( baseStyles );

	const activeStyles = useMemo( () => {
		// pluck slecetors with an 'active' modifier
		const activeSelectors = Object.keys( themedStyles ).filter(
			( key ) => !! key?.match( /--(.*)active/ )
		);

		// Remove the 'active' modifier from selector so it can be merged
		// with the themed style selector
		return activeSelectors.reduce( ( _activeStyles, activeSelector ) => {
			const selector = activeSelector.split( '--' )[ 0 ];
			_activeStyles[ selector ] = baseStyles[ activeSelector ];
			return _activeStyles;
		}, {} );
	}, [ themedStyles ] );

	const updatedStyles = useMemo( () => {
		if ( ! isActive ) {
			return themedStyles;
		}

		const updated = { ...themedStyles };

		for ( const selector in activeStyles ) {
			updated[ selector ] = {
				...themedStyles[ selector ],
				...activeStyles[ selector ],
			};
		}
		return updated;
	}, [ themedStyles, isActive ] );

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
		'inserter-search-form__right-icon': rightIconStyle,
	} = updatedStyles;

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
				<Icon icon={ Gridicons.search } fill={ iconStyle.color } />
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
			<View style={ [ cancelButtonStyle, { alignSelf: 'flex-start' } ] }>
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
			<View style={ { flex: 1, flexDirection: 'row' } }>
				<View style={ inputContainerStyle }>
					{ renderLeftButton() }
					<TextInput
						ref={ inputRef }
						style={ formInputStyle }
						placeholderTextColor={ placeholderStyle?.color }
						onChangeText={ onChange }
						onFocus={ () => setIsActive( true ) }
						value={ value }
						placeholder={ __( 'Search blocks' ) }
					/>
					{ renderRightButton() }
				</View>
				{ isActive && renderCancel() }
			</View>
		</TouchableOpacity>
	);
}

export default InserterSearchForm;
