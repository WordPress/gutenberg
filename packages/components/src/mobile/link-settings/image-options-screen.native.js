/**
 * External dependencies
 */
import { useNavigation, useRoute } from '@react-navigation/native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight } from '@wordpress/icons';

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

// TODO(David): Rename this component, file, and screen to better communicate
// intent
function ImageOptionsScreen( props ) {
	const navigation = useNavigation();
	const route = useRoute();
	const { url = '' } = props;
	const { inputValue = url, imageUrl, attachmentPageUrl, setAttributes } =
		route.params || {};

	function goToLinkPicker() {
		navigation.navigate( 'linkPicker', { inputValue } );
	}

	const setLinkDestination = ( linkDestination ) => () => {
		let newUrl;
		switch ( linkDestination ) {
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
		setAttributes( { url: newUrl, linkDestination } );
		navigation.goBack();
	};

	// TODO(David): Need to have a "active" status indicator (e.g. check mark) to
	// designate which option is selected. Could we compare the URLs to determine
	// which is active?
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
					label={ __( 'None' ) }
					leftAlign
					onPress={ setLinkDestination( LINK_DESTINATION_NONE ) }
				>
					<Icon icon={ chevronRight }></Icon>
				</Cell>
				<Cell
					label={ __( 'Media File' ) }
					leftAlign
					onPress={ setLinkDestination( LINK_DESTINATION_MEDIA ) }
				>
					<Icon icon={ chevronRight }></Icon>
				</Cell>
				<Cell
					label={ __( 'Attachment Page' ) }
					leftAlign
					onPress={ setLinkDestination(
						LINK_DESTINATION_ATTACHMENT
					) }
				>
					<Icon icon={ chevronRight }></Icon>
				</Cell>
				<Cell
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
