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

/**
 * Internal dependencies
 */
import styles from './styles.scss';
import BottomSheet from '../bottom-sheet';
import PanelBody from '../../panel/body';
import FooterMessageControl from '../../footer-message-control';

const BottomSheetTextControl = ( {
	initialValue,
	onChange,
	placeholder,
	label,
	icon,
	footerNote,
	cellPlaceholder,
	disabled,
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
					label={ label }
					onPress={ openSubSheet }
					value={ initialValue || '' }
					placeholder={ cellPlaceholder || placeholder || '' }
					disabled={ disabled }
				>
					{ disabled ? null : <Icon icon={ chevronRight } /> }
				</BottomSheet.Cell>
			}
			showSheet={ showSubSheet }
		>
			<>
				<BottomSheet.NavBar>
					<BottomSheet.NavBar.BackButton onPress={ goBack } />
					<BottomSheet.NavBar.Heading>
						{ label }
					</BottomSheet.NavBar.Heading>
				</BottomSheet.NavBar>
				<PanelBody style={ horizontalBorderStyle }>
					<TextInput
						label={ label }
						onChangeText={ ( text ) => onChange( text ) }
						defaultValue={ initialValue }
						multiline
						placeholder={ placeholder }
						placeholderTextColor="#87a6bc"
						style={ textEditorStyle }
						textAlignVertical="top"
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
