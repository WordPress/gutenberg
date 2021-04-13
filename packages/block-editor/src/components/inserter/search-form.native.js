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
import { ToolbarButton, Gridicons, Button } from '@wordpress/components';
import { Icon, cancelCircleFilled, arrowLeft, close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import platformStyles from './searchFormStyles.scss';

function InserterSearchForm( { value, onChange, onLayout = () => {} } ) {
	const [ isActive, setIsActive ] = useState( false );

	const isIOS = Platform.OS === 'ios';

	const inputRef = useRef();

	const containerStyle = usePreferredColorSchemeStyle(
		styles[ 'inserter-search-form__container' ],
		styles[ 'inserter-search-form__container--dark' ]
	);

	const containerActiveStyle = {
		...containerStyle,
		...usePreferredColorSchemeStyle(
			platformStyles[ 'inserter-search-form__container--active' ],
			platformStyles[ 'inserter-search-form__container--active-dark' ]
		),
	};

	const formStyle = {
		...usePreferredColorSchemeStyle(
			styles[ 'inserter-search-form__form' ],
			styles[ 'inserter-search-form__form--dark' ]
		),
		...usePreferredColorSchemeStyle(
			platformStyles[ 'inserter-search-form__form' ],
			platformStyles[ 'inserter-search-form__form--dark' ]
		),
	};

	const formActiveStyle = {
		...formStyle,
		...usePreferredColorSchemeStyle(
			platformStyles[ 'inserter-search-form__form--active' ],
			platformStyles[ 'inserter-search-form__form--active-dark' ]
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
			platformStyles[ 'inserter-search-form__form-input--active' ],
			platformStyles[ 'inserter-search-form__form-input--active-dark' ]
		),
	};

	const placeholderStyle = usePreferredColorSchemeStyle(
		styles[ 'inserter-search-form__form-input-placeholder' ],
		styles[ 'inserter-search-form__form-input-placeholder--dark' ]
	);

	const iconStyle = usePreferredColorSchemeStyle(
		styles[ 'inserter-search-form__icon' ],
		styles[ 'inserter-search-form__icon--dark' ]
	);

	const cancelButtonStyle = styles[ 'inserter-search-form__cancel-button' ];

	const cancelButtonTextStyle = usePreferredColorSchemeStyle(
		styles[ 'inserter-search-form__cancel-button-text' ],
		styles[ 'inserter-search-form__cancel-button-text--dark' ]
	);

	function onCancel() {
		inputRef.current.blur();
		onChange( '' );
		setIsActive( false );
	}

	function renderLeftButton() {
		if ( ! isIOS && isActive ) {
			return (
				<Button
					title={ __( 'Cancel Search' ) }
					icon={ arrowLeft }
					onClick={ onCancel }
				/>
			);
		}

		return <Icon icon={ Gridicons.search } />;
	}

	function renderRightButton() {
		// Add a View element to properly center the input placeholder via flexbox
		if ( isIOS && ! isActive ) {
			return <View style={ iconStyle } />;
		}

		if ( !! value ) {
			return (
				<ToolbarButton
					title={ __( 'Clear search' ) }
					icon={
						<Icon icon={ isIOS ? cancelCircleFilled : close } />
					}
					onClick={ () => {
						onChange( '' );
					} }
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
			<View style={ isActive ? formActiveStyle : formStyle }>
				<View style={ iconStyle }>{ renderLeftButton() }</View>
				<TextInput
					ref={ inputRef }
					style={ isActive ? formInputActiveStyle : formInputStyle }
					placeholderTextColor={ placeholderStyle.color }
					onChangeText={ onChange }
					onFocus={ () => setIsActive( true ) }
					value={ value }
					placeholder={ __( 'Search blocks' ) }
				/>
				{ renderRightButton() }
			</View>
			{ isActive && isIOS && (
				<View style={ cancelButtonStyle }>
					<Text onPress={ onCancel } style={ cancelButtonTextStyle }>
						{ __( 'Cancel' ) }
					</Text>
				</View>
			) }
		</TouchableOpacity>
	);
}

export default InserterSearchForm;
