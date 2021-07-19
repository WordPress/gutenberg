/**
 * External dependencies
 */
import { TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Icon, chevronRight } from '@wordpress/icons';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import {
	BottomSheet,
	PanelBody,
	FooterMessageControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const BottomSheetTextControl = ( {
	initialValue,
	onChange,
	placeholder,
	label,
	icon,
	footerNote,
} ) => {
	const [ showSubSheet, setShowSubSheet ] = useState( false );
	const navigation = useNavigation();

	const goBack = () => {
		setShowSubSheet( false );
		navigation.goBack();
	};

	const openSubSheet = () => {
		navigation.navigate( BottomSheet.SubSheet.screenName );
		setShowSubSheet( true );
	};

	const [ value, onChangeText ] = useState( initialValue );

	const horizontalBorderStyle = usePreferredColorSchemeStyle(
		styles.horizontalBorder,
		styles.horizontalBorderDark
	);

	const textEditorStyle = usePreferredColorSchemeStyle(
		styles.textEditor,
		styles.textEditorDark
	);

	return (
		<BottomSheet.SubSheet
			navigationButton={
				<BottomSheet.Cell
					icon={ icon }
					placeholder={ placeholder }
					label={ label }
					onPress={ openSubSheet }
					value={ initialValue || '' }
				>
					<Icon icon={ chevronRight }></Icon>
				</BottomSheet.Cell>
			}
			showSheet={ showSubSheet }
		>
			<>
				<BottomSheet.NavigationHeader
					screen={ label }
					leftButtonOnPress={ goBack }
				/>
				<PanelBody
					style={ [
						horizontalBorderStyle,
						styles.textEditorContainer,
					] }
				>
					<TextInput
						label={ label }
						onChangeText={ ( text ) => onChangeText( text ) }
						onChange={ onChange( value ) }
						value={ value }
						multiline={ true }
						placeholder={ placeholder }
						placeholderTextColor={ '#87a6bc' }
						style={ textEditorStyle }
						textAlignVertical={ 'top' }
					/>
				</PanelBody>
			</>

			{ footerNote && (
				<PanelBody style={ styles.textFooternote }>
					<FooterMessageControl
						label={ footerNote }
						textAlign="left"
					/>
				</PanelBody>
			) }
		</BottomSheet.SubSheet>
	);
};

export default BottomSheetTextControl;
