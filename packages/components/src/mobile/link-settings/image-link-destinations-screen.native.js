/**
 * External dependencies
 */
import { useNavigation, useRoute } from '@react-navigation/native';
import { StyleSheet } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, check, chevronRight } from '@wordpress/icons';
import { blockSettingsScreens } from '@wordpress/block-editor';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import PanelBody from '../../panel/body';
import BottomSheet from '../bottom-sheet';

const LINK_DESTINATION_NONE = 'none';
const LINK_DESTINATION_MEDIA = 'media';
const LINK_DESTINATION_ATTACHMENT = 'attachment';
const LINK_DESTINATION_CUSTOM = 'custom';

function LinkDestination( {
	children,
	isSelected,
	label,
	onPress,
	value,
	valueStyle,
} ) {
	const optionIcon = usePreferredColorSchemeStyle(
		styles.optionIcon,
		styles.optionIconDark
	);
	return (
		<BottomSheet.Cell
			icon={ check }
			iconStyle={ StyleSheet.flatten( [
				optionIcon,
				! isSelected && styles.unselectedOptionIcon,
			] ) }
			label={ label }
			leftAlign
			onPress={ onPress }
			value={ value }
			valueStyle={ valueStyle }
			separatorType="leftMargin"
		>
			{ children }
		</BottomSheet.Cell>
	);
}

function ImageLinkDestinationsScreen( props ) {
	const navigation = useNavigation();
	const route = useRoute();
	const { url = '' } = props;
	const {
		inputValue = url,
		imageUrl,
		attachmentPageUrl,
		linkDestination,
	} = route.params || {};

	function goToLinkPicker() {
		navigation.navigate( blockSettingsScreens.linkPicker, {
			inputValue:
				linkDestination === LINK_DESTINATION_CUSTOM ? inputValue : '',
		} );
	}

	const setLinkDestination = ( newLinkDestination ) => () => {
		let newUrl;
		switch ( newLinkDestination ) {
			case LINK_DESTINATION_MEDIA:
				newUrl = imageUrl;
				break;
			case LINK_DESTINATION_ATTACHMENT:
				newUrl = attachmentPageUrl;
				break;
			default:
				newUrl = '';
				break;
		}

		navigation.navigate( blockSettingsScreens.settings, {
			// The `inputValue` name is reused from LinkPicker, as it helps avoid
			// bugs from stale values remaining in the React Navigation route
			// parameters.
			inputValue: newUrl,
			// Clear link text value that may be set from LinkPicker.
			text: '',
		} );
	};

	return (
		<>
			<BottomSheet.NavBar>
				<BottomSheet.NavBar.BackButton onPress={ navigation.goBack } />
				<BottomSheet.NavBar.Heading>
					{ __( 'Link To' ) }
				</BottomSheet.NavBar.Heading>
			</BottomSheet.NavBar>
			<PanelBody>
				<LinkDestination
					isSelected={ linkDestination === LINK_DESTINATION_NONE }
					label={ __( 'None' ) }
					onPress={ setLinkDestination( LINK_DESTINATION_NONE ) }
				/>
				<LinkDestination
					isSelected={ linkDestination === LINK_DESTINATION_MEDIA }
					label={ __( 'Media File' ) }
					onPress={ setLinkDestination( LINK_DESTINATION_MEDIA ) }
				/>
				{ !! attachmentPageUrl && (
					<LinkDestination
						isSelected={
							linkDestination === LINK_DESTINATION_ATTACHMENT
						}
						label={ __( 'Attachment Page' ) }
						onPress={ setLinkDestination(
							LINK_DESTINATION_ATTACHMENT
						) }
					/>
				) }
				<LinkDestination
					isSelected={ linkDestination === LINK_DESTINATION_CUSTOM }
					label={ __( 'Custom URL' ) }
					onPress={ goToLinkPicker }
					value={
						linkDestination === LINK_DESTINATION_CUSTOM
							? inputValue
							: ''
					}
					valueStyle={
						linkDestination === LINK_DESTINATION_CUSTOM
							? undefined
							: styles.placeholderTextColor
					}
				>
					<Icon icon={ chevronRight }></Icon>
				</LinkDestination>
			</PanelBody>
		</>
	);
}

export default ImageLinkDestinationsScreen;
