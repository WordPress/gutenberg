/**
 * External dependencies
 */
import { Text, TextInput, View, TouchableHighlight } from 'react-native';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { ToolbarButton } from '@wordpress/components';
import {
	Icon,
	cancelCircleFilled,
	arrowLeft,
	search as searchIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './style.scss';

function InserterSearchForm( { value, onChange, isActive } ) {
	const [ showInput, setShowInput ] = useState( isActive );

	// Search button styles
	const searchButtonWrapperStyle = usePreferredColorSchemeStyle(
		styles.searcButtonWrapper,
		styles.searcButtonWrapperDark
	);
	const searchButtonStyle = usePreferredColorSchemeStyle(
		styles.searchButton,
		styles.searchButtonDark
	);

	const searchButtonContentStyle = usePreferredColorSchemeStyle(
		styles.searchButtonContent,
		styles.searchButtonContentDark
	);

	const searchButtonIconStyle = usePreferredColorSchemeStyle(
		styles.searchButtonIcon,
		styles.searchButtonIconDark
	);

	// Search form styles
	const searchFormStyle = usePreferredColorSchemeStyle(
		styles.searchForm,
		styles.searchFormDark
	);

	const searchFormInputStyle = usePreferredColorSchemeStyle(
		styles.searchFormInput,
		styles.searchFormInputDark
	);

	const placeholderStyle = usePreferredColorSchemeStyle(
		styles.searchFormPlaceholder,
		styles.searchFormPlaceholderDark
	);

	if ( ! showInput ) {
		return (
			<TouchableHighlight
				style={ searchButtonWrapperStyle }
				onPress={ () => {
					setShowInput( true );
				} }
			>
				<View style={ searchButtonStyle }>
					<View style={ [ searchButtonContentStyle ] }>
						<Icon
							icon={ searchIcon }
							fill={ searchButtonIconStyle.fill }
							size={ searchButtonIconStyle.height }
						/>
					</View>
					<Text style={ [ searchButtonContentStyle ] }>
						{ __( 'Search blocks' ) }
					</Text>
				</View>
			</TouchableHighlight>
		);
	}
	return (
		<View style={ searchFormStyle }>
			<View style={ { flexDirection: 'row' } }>
				<ToolbarButton
					title={ __( 'Cancel search' ) }
					icon={ <Icon icon={ arrowLeft } /> }
					onClick={ () => {
						setShowInput( false );
						onChange( '' );
					} }
				/>
				<TextInput
					style={ searchFormInputStyle }
					placeholderTextColor={ placeholderStyle.color }
					onChangeText={ onChange }
					value={ value }
					placeholder={ __( 'Search blocks' ) }
				/>
			</View>
			{ !! value && (
				<ToolbarButton
					title={ __( 'Clear search' ) }
					icon={ <Icon icon={ cancelCircleFilled } /> }
					onClick={ () => {
						onChange( '' );
					} }
				/>
			) }
		</View>
	);
}

export default InserterSearchForm;
