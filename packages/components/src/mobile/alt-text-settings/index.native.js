/**
 * External dependencies
 */
import { TextInput, Text, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Icon, chevronRight, textColor } from '@wordpress/icons';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { BottomSheet, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const AltTextSettings = ( { alt, updateAlt } ) => {
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

	const [ value, onChangeText ] = useState( alt );

	const horizontalBorderStyle = usePreferredColorSchemeStyle(
		styles.horizontalBorder,
		styles.horizontalBorderDark
	);

	const altTextEditorStyle = usePreferredColorSchemeStyle(
		styles.altTextEditor,
		styles.altTextEditorDark
	);

	return (
		<BottomSheet.SubSheet
			navigationButton={
				<BottomSheet.Cell
					icon={ textColor }
					placeholder={ __( 'Add alt text' ) }
					label={ __( 'Alt Text' ) }
					onPress={ openSubSheet }
					value={ alt || '' }
				>
					<Icon icon={ chevronRight }></Icon>
				</BottomSheet.Cell>
			}
			showSheet={ showSubSheet }
		>
			<>
				<BottomSheet.NavigationHeader
					screen={ __( 'Alt Text' ) }
					leftButtonOnPress={ goBack }
				/>
				<PanelBody style={ horizontalBorderStyle }>
					<TextInput
						label={ __( 'Alt Text' ) }
						onChangeText={ ( text ) => onChangeText( text ) }
						onChange={ updateAlt( value ) }
						value={ value }
						multiline={ true }
						placeholder={ __( 'Add alt text' ) }
						placeholderTextColor={ '#87a6bc' }
						style={ altTextEditorStyle }
						textAlignVertical={ 'top' }
					/>
				</PanelBody>

				<Text style={ styles.altTextFootnote }>
					{ __(
						'Describe the purpose of the image. Leave empty if the image is purely decorative. '
					) }
					<Text
						style={ styles.altTextLink }
						onPress={ () =>
							Linking.openURL(
								'https://www.w3.org/WAI/tutorials/images/decision-tree/'
							)
						}
					>
						{ __( 'What is alt text?' ) }
					</Text>
				</Text>
			</>
		</BottomSheet.SubSheet>
	);
};

export default AltTextSettings;
