/**
 * External dependencies
 */
import { useNavigation, useRoute } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, check, chevronRight } from '@wordpress/icons';

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

function ImageLinkDestinationsScreen( props ) {
	const navigation = useNavigation();
	const route = useRoute();
	const { url = '' } = props;
	const {
		inputValue = url,
		imageUrl,
		attachmentPageUrl,
		setAttributes,
		linkDestination,
	} = route.params || {};

	const customUrlSet =
		!! inputValue &&
		inputValue !== imageUrl &&
		inputValue !== attachmentPageUrl;

	function goToLinkPicker() {
		navigation.navigate( 'linkPicker', {
			inputValue: customUrlSet ? inputValue : '',
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

		setAttributes( { url: newUrl, linkDestination: newLinkDestination } );
		navigation.goBack();
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
				<BottomSheet.Cell
					icon={ check }
					iconStyle={
						linkDestination !== LINK_DESTINATION_NONE &&
						styles.unselectedOptionIcon
					}
					label={ __( 'None' ) }
					leftAlign
					onPress={ setLinkDestination( LINK_DESTINATION_NONE ) }
					separatorType="leftMargin"
				/>
				<BottomSheet.Cell
					icon={ check }
					iconStyle={
						linkDestination !== LINK_DESTINATION_MEDIA &&
						styles.unselectedOptionIcon
					}
					label={ __( 'Media File' ) }
					leftAlign
					onPress={ setLinkDestination( LINK_DESTINATION_MEDIA ) }
					separatorType="leftMargin"
				/>
				{ !! attachmentPageUrl && (
					<BottomSheet.Cell
						icon={ check }
						iconStyle={
							linkDestination !== LINK_DESTINATION_ATTACHMENT &&
							styles.unselectedOptionIcon
						}
						label={ __( 'Attachment Page' ) }
						leftAlign
						onPress={ setLinkDestination(
							LINK_DESTINATION_ATTACHMENT
						) }
						separatorType="leftMargin"
					/>
				) }
				<BottomSheet.Cell
					icon={ check }
					iconStyle={
						linkDestination !== LINK_DESTINATION_CUSTOM &&
						styles.unselectedOptionIcon
					}
					label={ __( 'Custom URL' ) }
					leftAlign
					// since this is not actually editable, we treat value as a placeholder
					value={
						customUrlSet ? inputValue : __( 'Search or type URL' )
					}
					valueStyle={
						customUrlSet ? undefined : styles.placeholderTextColor
					}
					onPress={ goToLinkPicker }
					separatorType="leftMargin"
				>
					<Icon icon={ chevronRight }></Icon>
				</BottomSheet.Cell>
			</PanelBody>
		</>
	);
}

export default ImageLinkDestinationsScreen;
