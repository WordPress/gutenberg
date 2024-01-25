/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { BottomSheet, Icon, TextControl } from '@wordpress/components';
import {
	requestUnsupportedBlockFallback,
	sendActionButtonPressedAction,
	actionButtons,
} from '@wordpress/react-native-bridge';
import { help } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { getBlockType } from '@wordpress/blocks';
import { useCallback, useState } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import useUnsupportedBlockEditor from '../use-unsupported-block-editor';

const EMPTY_ARRAY = [];

const UnsupportedBlockDetails = ( {
	clientId,
	showSheet,
	onCloseSheet,
	customBlockTitle = '',
	icon,
	title,
	description,
	actionButtonLabel,
	customActions = EMPTY_ARRAY,
} ) => {
	const [ sendFallbackMessage, setSendFallbackMessage ] = useState( false );
	const [ sendButtonPressMessage, setSendButtonPressMessage ] =
		useState( false );

	const {
		blockName,
		blockContent,
		isUnsupportedBlockEditorSupported,
		canEnableUnsupportedBlockEditor,
		isEditableInUnsupportedBlockEditor,
	} = useUnsupportedBlockEditor( clientId );

	// Styles
	const textStyle = usePreferredColorSchemeStyle(
		styles[ 'unsupported-block-details__text' ],
		styles[ 'unsupported-block-details__text--dark' ]
	);
	const titleStyle = usePreferredColorSchemeStyle(
		styles[ 'unsupported-block-details__title' ],
		styles[ 'unsupported-block-details__title--dark' ]
	);
	const descriptionStyle = usePreferredColorSchemeStyle(
		styles[ 'unsupported-block-details__description' ],
		styles[ 'unsupported-block-details__description--dark' ]
	);
	const iconStyle = usePreferredColorSchemeStyle(
		styles[ 'unsupported-block-details__icon' ],
		styles[ 'unsupported-block-details__icon--dark' ]
	);
	const actionButtonStyle = usePreferredColorSchemeStyle(
		styles[ 'unsupported-block-details__action-button' ],
		styles[ 'unsupported-block-details__action-button--dark' ]
	);

	const blockTitle =
		customBlockTitle || getBlockType( blockName )?.title || blockName;

	const requestFallback = useCallback( () => {
		if (
			canEnableUnsupportedBlockEditor &&
			isUnsupportedBlockEditorSupported === false
		) {
			onCloseSheet();
			setSendButtonPressMessage( true );
		} else {
			onCloseSheet();
			setSendFallbackMessage( true );
		}
	}, [
		canEnableUnsupportedBlockEditor,
		isUnsupportedBlockEditorSupported,
		onCloseSheet,
	] );

	// The description can include extra notes via WP hooks.
	const descriptionWithNotes = applyFilters(
		'native.unsupported_block_details_extra_note',
		description,
		blockName
	);

	const webEditorDefaultLabel = applyFilters(
		'native.unsupported_block_details_web_editor_action',
		__( 'Edit using web editor' )
	);

	const canUseWebEditor =
		( isUnsupportedBlockEditorSupported ||
			canEnableUnsupportedBlockEditor ) &&
		isEditableInUnsupportedBlockEditor;
	const actions = [
		...[
			canUseWebEditor && {
				label: actionButtonLabel || webEditorDefaultLabel,
				onPress: requestFallback,
			},
		],
		...customActions,
	].filter( Boolean );

	return (
		<BottomSheet
			isVisible={ showSheet }
			hideHeader
			onClose={ onCloseSheet }
			onModalHide={ () => {
				if ( sendFallbackMessage ) {
					// On iOS, onModalHide is called when the controller is still part of the hierarchy.
					// A small delay will ensure that the controller has already been removed.
					this.timeout = setTimeout( () => {
						// For the Classic block, the content is kept in the `content` attribute.
						requestUnsupportedBlockFallback(
							blockContent,
							clientId,
							blockName,
							blockTitle
						);
					}, 100 );
					setSendFallbackMessage( false );
				} else if ( sendButtonPressMessage ) {
					this.timeout = setTimeout( () => {
						sendActionButtonPressedAction(
							actionButtons.missingBlockAlertActionButton
						);
					}, 100 );
					setSendButtonPressMessage( false );
				}
			} }
		>
			<View style={ styles[ 'unsupported-block-details__container' ] }>
				<Icon
					icon={ icon || help }
					color={ iconStyle.color }
					size={ iconStyle.size }
				/>
				<Text style={ [ textStyle, titleStyle ] }>{ title }</Text>
				{ isEditableInUnsupportedBlockEditor &&
					descriptionWithNotes && (
						<Text style={ [ textStyle, descriptionStyle ] }>
							{ descriptionWithNotes }
						</Text>
					) }
			</View>
			{ actions.map( ( { label, onPress }, index ) => (
				<TextControl
					key={ `${ label } - ${ index }` }
					label={ label }
					separatorType="topFullWidth"
					onPress={ onPress }
					labelStyle={ actionButtonStyle }
				/>
			) ) }
			<TextControl
				label={ __( 'Dismiss' ) }
				separatorType="topFullWidth"
				onPress={ onCloseSheet }
				labelStyle={ actionButtonStyle }
			/>
		</BottomSheet>
	);
};

export default UnsupportedBlockDetails;
