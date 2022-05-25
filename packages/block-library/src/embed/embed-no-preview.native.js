/**
 * External dependencies
 */
import { TouchableOpacity, TouchableWithoutFeedback, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { View } from '@wordpress/primitives';

import { __, sprintf } from '@wordpress/i18n';
import { useRef, useState } from '@wordpress/element';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { requestPreview } from '@wordpress/react-native-bridge';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { BottomSheet, Icon, TextControl } from '@wordpress/components';
import { help } from '@wordpress/icons';
import { BlockIcon } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

const EmbedNoPreview = ( {
	label,
	icon,
	isSelected,
	onPress,
	previewable,
	isDefaultEmbedInfo,
} ) => {
	const shouldRequestReview = useRef( false );
	const [ isSheetVisible, setIsSheetVisible ] = useState( false );

	const { postType } = useSelect( ( select ) => ( {
		postType: select( editorStore ).getEditedPostAttribute( 'type' ),
	} ) );

	const containerStyle = usePreferredColorSchemeStyle(
		styles.embed__container,
		styles[ 'embed__container--dark' ]
	);
	const labelStyle = usePreferredColorSchemeStyle(
		styles.embed__label,
		styles[ 'embed__label--dark' ]
	);
	const descriptionStyle = usePreferredColorSchemeStyle(
		styles.embed__description,
		styles[ 'embed__description--dark' ]
	);
	const helpIconStyle = usePreferredColorSchemeStyle(
		styles[ 'embed-no-preview__help-icon' ],
		styles[ 'embed-no-preview__help-icon--dark' ]
	);

	const sheetIconStyle = usePreferredColorSchemeStyle(
		styles[ 'embed-no-preview__sheet-icon' ],
		styles[ 'embed-no-preview__sheet-icon--dark' ]
	);
	const sheetTitleStyle = usePreferredColorSchemeStyle(
		styles[ 'embed-no-preview__sheet-title' ],
		styles[ 'embed-no-preview__sheet-title--dark' ]
	);
	const sheetDescriptionStyle = usePreferredColorSchemeStyle(
		styles[ 'embed-no-preview__sheet-description' ],
		styles[ 'embed-no-preview__sheet-description--dark' ]
	);
	const sheetButtonStyle = usePreferredColorSchemeStyle(
		styles[ 'embed-no-preview__sheet-button' ],
		styles[ 'embed-no-preview__sheet-button--dark' ]
	);

	const previewButtonA11yHint =
		postType === 'page'
			? __( 'Double tap to preview page.' )
			: __( 'Double tap to preview post.' );
	const previewButtonText =
		postType === 'page' ? __( 'Preview page' ) : __( 'Preview post' );
	const comingSoonDescription =
		postType === 'page'
			? sprintf(
					// translators: %s: embed block variant's label e.g: "Twitter".
					__(
						'We’re working hard on adding support for %s previews. In the meantime, you can preview the embedded content on the page.'
					),
					label
			  )
			: sprintf(
					// translators: %s: embed block variant's label e.g: "Twitter".
					__(
						'We’re working hard on adding support for %s previews. In the meantime, you can preview the embedded content on the post.'
					),
					label
			  );

	function onOpenSheet() {
		setIsSheetVisible( true );
	}

	function onCloseSheet() {
		setIsSheetVisible( false );
	}

	function onDismissSheet() {
		// The preview request has to be done after the bottom sheet modal is dismissed,
		// otherwise the preview native modal is not displayed.
		if ( shouldRequestReview.current ) {
			requestPreview();
		}
		shouldRequestReview.current = false;
	}

	function onPressContainer() {
		onPress();
		onOpenSheet();
	}

	function onPressHelp() {
		onPressContainer();
	}

	const embedNoProviderPreview = (
		<>
			<TouchableWithoutFeedback
				accessibilityRole={ 'button' }
				accessibilityHint={ previewButtonA11yHint }
				disabled={ ! isSelected }
				onPress={ onPressContainer }
			>
				<View style={ containerStyle }>
					<BlockIcon icon={ icon } />
					<Text style={ labelStyle }>{ label }</Text>
					<Text style={ descriptionStyle }>
						{ sprintf(
							// translators: %s: embed block variant's label e.g: "Twitter".
							__( '%s previews not yet available' ),
							label
						) }
					</Text>
					<Text style={ styles.embed__action }>
						{ previewButtonText.toUpperCase() }
					</Text>
					<TouchableOpacity
						accessibilityHint={ __( 'Tap here to show help' ) }
						accessibilityLabel={ __( 'Help button' ) }
						accessibilityRole={ 'button' }
						disabled={ ! isSelected }
						onPress={ onPressHelp }
						style={ helpIconStyle }
					>
						<Icon
							icon={ help }
							fill={ helpIconStyle.fill }
							size={ helpIconStyle.width }
						/>
					</TouchableOpacity>
				</View>
			</TouchableWithoutFeedback>
			<BottomSheet
				isVisible={ isSheetVisible }
				hideHeader
				onDismiss={ onDismissSheet }
				onClose={ onCloseSheet }
				testID="embed-no-preview-modal"
			>
				<View style={ styles[ 'embed-no-preview__container' ] }>
					<View style={ sheetIconStyle }>
						<Icon
							icon={ help }
							fill={ sheetIconStyle.fill }
							size={ sheetIconStyle.width }
						/>
					</View>
					<Text style={ sheetTitleStyle }>
						{ isDefaultEmbedInfo
							? __( 'Embed block previews are coming soon' )
							: sprintf(
									// translators: %s: embed block variant's label e.g: "Twitter".
									__(
										'%s embed block previews are coming soon'
									),
									label
							  ) }
					</Text>
					<Text style={ sheetDescriptionStyle }>
						{ comingSoonDescription }
					</Text>
				</View>
				<TextControl
					label={ previewButtonText }
					separatorType="topFullWidth"
					onPress={ () => {
						shouldRequestReview.current = true;
						onCloseSheet();
					} }
					labelStyle={ sheetButtonStyle }
				/>
				<TextControl
					label={ __( 'Dismiss' ) }
					separatorType="topFullWidth"
					onPress={ onCloseSheet }
					labelStyle={ sheetButtonStyle }
				/>
			</BottomSheet>
		</>
	);

	return (
		<>
			{ previewable ? (
				embedNoProviderPreview
			) : (
				<View style={ containerStyle }>
					<BlockIcon icon={ icon } />
					<Text style={ labelStyle }>
						{ __( 'No preview available' ) }
					</Text>
				</View>
			) }
		</>
	);
};

export default EmbedNoPreview;
