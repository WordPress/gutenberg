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
import Cell from '../bottom-sheet/cell';
import styles from './style.scss';
import PanelBody from '../../panel/body';
import BottomSheet from '../bottom-sheet';

const LINK_DESTINATION_NONE = 'none';
const LINK_DESTINATION_MEDIA = 'media';
const LINK_DESTINATION_ATTACHMENT = 'attachment';
const LINK_DESTINATION_CUSTOM = 'custom';

// TODO(David): Rename this component, file, and screen to better communicate
// intent
function ImageOptionsScreen( props ) {
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

	function goToLinkPicker() {
		navigation.navigate( 'linkPicker', { inputValue } );
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
				newUrl = null;
				break;
		}
		// TODO(David): Most of the logic for updatting the attributes is contained
		// within LinkSettings. We may need to create an abstracted hook.
		// `setAttributes` is likely not enough.
		setAttributes( { url: newUrl, linkDestination: newLinkDestination } );
		navigation.goBack();
	};

	// TODO(David): Non-selected items do not display an icon, which causes
	// misalignment with the selected item. We need to update Cell to support the
	// use case of retaining space on the left side for a conditional icon.
	return (
		<>
			<BottomSheet.NavBar>
				<BottomSheet.NavBar.BackButton onPress={ navigation.goBack } />
				<BottomSheet.NavBar.Heading>
					{ __( 'Link To' ) }
				</BottomSheet.NavBar.Heading>
			</BottomSheet.NavBar>
			<PanelBody>
				<Cell
					icon={
						linkDestination === LINK_DESTINATION_NONE
							? check
							: undefined
					}
					label={ __( 'None' ) }
					leftAlign
					onPress={ setLinkDestination( LINK_DESTINATION_NONE ) }
				/>
				<Cell
					icon={
						linkDestination === LINK_DESTINATION_MEDIA
							? check
							: undefined
					}
					label={ __( 'Media File' ) }
					leftAlign
					onPress={ setLinkDestination( LINK_DESTINATION_MEDIA ) }
				/>
				<Cell
					icon={
						linkDestination === LINK_DESTINATION_ATTACHMENT
							? check
							: undefined
					}
					label={ __( 'Attachment Page' ) }
					leftAlign
					onPress={ setLinkDestination(
						LINK_DESTINATION_ATTACHMENT
					) }
				/>
				<Cell
					icon={
						linkDestination === LINK_DESTINATION_CUSTOM
							? check
							: undefined
					}
					label={ __( 'Custom URL' ) }
					leftAlign
					// since this is not actually editable, we treat value as a placeholder
					value={ inputValue || __( 'Search or type URL' ) }
					valueStyle={
						!! inputValue ? undefined : styles.placeholderColor
					}
					onPress={ goToLinkPicker }
				>
					<Icon icon={ chevronRight }></Icon>
				</Cell>
			</PanelBody>
		</>
	);
}

export default ImageOptionsScreen;
