/**
 * External dependencies
 */
import {
	TextInput,
	Text,
	View,
	Platform,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { ToolbarButton, Gridicons } from '@wordpress/components';
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

	function isInactive() {
		return ! value && ! isActive;
	}

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

	function onActivate() {
		inputRef.current.focus();
		setIsActive( true );
	}

	function renderLeftButton() {
		if ( ! isIOS && isActive ) {
			return (
				<ToolbarButton
					title={ __( 'Cancel Search' ) }
					icon={ arrowLeft }
					onClick={ onCancel }
				/>
			);
		}

		return (
			<ToolbarButton
				title={ __( 'Search Blocks' ) }
				icon={ Gridicons.search }
				onClick={ onActivate }
			/>
		);
	}

	function renderRightButton() {
		if ( isInactive() ) {
			return (
				<ToolbarButton
					title={ __( 'Search Blocks' ) }
					onClick={ onActivate }
				/>
			);
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
		<View
			style={ isActive ? containerActiveStyle : containerStyle }
			onLayout={ onLayout }
		>
			<View style={ isActive ? formActiveStyle : formStyle }>
				{ renderLeftButton() }
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
		</View>
	);
}

export default InserterSearchForm;
