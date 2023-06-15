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
import { useState, useRef, useMemo, useEffect } from '@wordpress/element';
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

function selectModifiedStyles( styles, modifier ) {
	const modifierMatcher = new RegExp( `--${ modifier }$` );
	const modifierSelectors = Object.keys( styles ).filter( ( selector ) =>
		selector.match( modifierMatcher )
	);

	return modifierSelectors.reduce( ( modifiedStyles, modifierSelector ) => {
		const blockElementSelector = modifierSelector.split( '--' )[ 0 ];
		modifiedStyles[ blockElementSelector ] = styles[ modifierSelector ];
		return modifiedStyles;
	}, {} );
}

function mergeStyles( styles, updateStyles, selectors ) {
	selectors.forEach( ( selector ) => {
		styles[ selector ] = {
			...styles[ selector ],
			...updateStyles[ selector ],
		};
	} );

	return styles;
}

function SearchControl( {
	value,
	onChange,
	placeholder = __( 'Search blocks' ),
} ) {
	const [ isActive, setIsActive ] = useState( false );
	const [ currentStyles, setCurrentStyles ] = useState( baseStyles );

	const isDark = useColorScheme() === 'dark';
	const inputRef = useRef();
	const onCancelTimer = useRef();

	const isIOS = Platform.OS === 'ios';

	const darkStyles = useMemo( () => {
		return selectModifiedStyles( baseStyles, 'dark' );
	}, [] );

	const activeStyles = useMemo( () => {
		return selectModifiedStyles( baseStyles, 'active' );
	}, [] );

	const activeDarkStyles = useMemo( () => {
		return selectModifiedStyles( baseStyles, 'active-dark' );
	}, [] );

	useEffect( () => {
		let futureStyles = { ...baseStyles };

		function mergeFutureStyles( modifiedStyles, shouldUseConditions ) {
			const shouldUseModified = shouldUseConditions.every(
				( should ) => should
			);

			const updatedStyles = shouldUseModified
				? modifiedStyles
				: futureStyles;

			const selectors = Object.keys( modifiedStyles );

			futureStyles = mergeStyles(
				futureStyles,
				updatedStyles,
				selectors
			);
		}

		mergeFutureStyles( activeStyles, [ isActive ] );
		mergeFutureStyles( darkStyles, [ isDark ] );
		mergeFutureStyles( activeDarkStyles, [ isActive, isDark ] );

		setCurrentStyles( futureStyles );
		// Disable reason: deferring this refactor to the native team.
		// see https://github.com/WordPress/gutenberg/pull/41166
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isActive, isDark ] );

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
		// Disable reason: deferring this refactor to the native team.
		// see https://github.com/WordPress/gutenberg/pull/41166
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

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
	} = currentStyles;

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
