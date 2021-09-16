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

function LinkDestination( {
	children,
	currentOption,
	label,
	option,
	onPress,
	value,
	valueStyle,
} ) {
	return (
		<BottomSheet.Cell
			icon={ check }
			iconStyle={
				currentOption !== option && styles.unselectedOptionIcon
			}
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
				<LinkDestination
					currentOption={ linkDestination }
					option={ LINK_DESTINATION_NONE }
					label={ __( 'None' ) }
					onPress={ setLinkDestination( LINK_DESTINATION_NONE ) }
				/>
				<LinkDestination
					currentOption={ linkDestination }
					option={ LINK_DESTINATION_MEDIA }
					label={ __( 'Media File' ) }
					onPress={ setLinkDestination( LINK_DESTINATION_MEDIA ) }
				/>
				{ !! attachmentPageUrl && (
					<LinkDestination
						currentOption={ linkDestination }
						option={ LINK_DESTINATION_ATTACHMENT }
						label={ __( 'Attachment Page' ) }
						onPress={ setLinkDestination(
							LINK_DESTINATION_ATTACHMENT
						) }
					/>
				) }
				<LinkDestination
					currentOption={ linkDestination }
					option={ LINK_DESTINATION_CUSTOM }
					label={ __( 'Custom URL' ) }
					onPress={ goToLinkPicker }
					// since this is not actually editable, we treat value as a placeholder
					value={
						customUrlSet ? inputValue : __( 'Search or type URL' )
					}
					valueStyle={
						customUrlSet ? undefined : styles.placeholderTextColor
					}
				>
					<Icon icon={ chevronRight }></Icon>
				</LinkDestination>
			</PanelBody>
		</>
	);
}

export default ImageLinkDestinationsScreen;
