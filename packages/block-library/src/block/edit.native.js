/**
 * External dependencies
 */
import {
	ActivityIndicator,
	Platform,
	Text,
	TouchableWithoutFeedback,
	View,
} from 'react-native';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { useEntityBlockEditor } from '@wordpress/core-data';
import { BottomSheet, Icon, Disabled } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { BlockEditorProvider, BlockList } from '@wordpress/block-editor';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { help } from '@wordpress/icons';
import {
	requestUnsupportedBlockFallback,
	sendActionButtonPressedAction,
	actionButtons,
} from '@wordpress/react-native-bridge';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import styles from './editor.scss';
import EditTitle from './edit-title';

export default function ReusableBlockEdit( {
	attributes: { ref },
	clientId,
	isSelected,
} ) {
	const recordArgs = [ 'postType', 'wp_block', ref ];

	const [ showHelp, setShowHelp ] = useState( false );
	const [ sendFallbackMessage, setSendFallbackMessage ] = useState( false );
	const [ sendButtonPressMessage, setSendButtonPressMessage ] = useState(
		false
	);
	const timeoutId = useRef();
	const infoTextStyle = usePreferredColorSchemeStyle(
		styles.infoText,
		styles.infoTextDark
	);
	const infoTitleStyle = usePreferredColorSchemeStyle(
		styles.infoTitle,
		styles.infoTitleDark
	);
	const infoSheetIconStyle = usePreferredColorSchemeStyle(
		styles.infoSheetIcon,
		styles.infoSheetIconDark
	);
	const actionButtonStyle = usePreferredColorSchemeStyle(
		styles.actionButton,
		styles.actionButtonDark
	);
	const spinnerStyle = usePreferredColorSchemeStyle(
		styles.spinner,
		styles.spinnerDark
	);

	const {
		reusableBlock,
		hasResolved,
		isEditing,
		settings,
		isUnsupportedBlockEditorSupported,
		canEnableUnsupportedBlockEditor,
	} = useSelect(
		( select ) => {
			const { getSettings } = select( 'core/block-editor' );

			return {
				reusableBlock: select( 'core' ).getEditedEntityRecord(
					...recordArgs
				),
				hasResolved: select( 'core' ).hasFinishedResolution(
					'getEditedEntityRecord',
					recordArgs
				),
				isSaving: select( 'core' ).isSavingEntityRecord(
					...recordArgs
				),
				canUserUpdate: select( 'core' ).canUser(
					'update',
					'blocks',
					ref
				),
				isEditing: select(
					reusableBlocksStore
				).__experimentalIsEditingReusableBlock( clientId ),
				settings: getSettings(),
				isUnsupportedBlockEditorSupported:
					getSettings( 'capabilities' ).unsupportedBlockEditor ===
					true,
				canEnableUnsupportedBlockEditor:
					getSettings( 'capabilities' )
						.canEnableUnsupportedBlockEditor === true,
			};
		},
		[ ref, clientId ]
	);

	const { invalidateResolution } = useDispatch( 'core' );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_block',
		{ id: ref }
	);

	useEffect( () => {
		return () => {
			clearTimeout( timeoutId.current );
			/**
			 * Invalidate entity record upon unmount to keep the reusable block updated
			 * in case it's modified through UBE
			 */
			invalidateResolution( 'getEntityRecord', recordArgs );
		};
	}, [] );

	function openSheet() {
		setShowHelp( true );
	}

	function closeSheet() {
		setShowHelp( false );
	}

	function requestFallback() {
		closeSheet();

		if (
			canEnableUnsupportedBlockEditor &&
			! isUnsupportedBlockEditorSupported
		) {
			setSendButtonPressMessage( true );
		} else {
			setSendFallbackMessage( true );
		}
	}

	function renderSheet() {
		const infoTitle =
			Platform.OS === 'android'
				? __(
						"Reusable blocks aren't editable on WordPress for Android"
				  )
				: __( "Reusable blocks aren't editable on WordPress for iOS" );
		const reusableBlockActionButton = applyFilters(
			'native.reusable_block_action_button',
			__( 'Edit using web editor' )
		);

		return (
			<BottomSheet
				isVisible={ showHelp }
				hideHeader
				onClose={ closeSheet }
				onModalHide={ () => {
					if ( sendFallbackMessage ) {
						// On iOS, onModalHide is called when the controller is still part of the hierarchy.
						// A small delay will ensure that the controller has already been removed.
						timeoutId.current = setTimeout( () => {
							requestUnsupportedBlockFallback(
								`<!-- wp:block {"ref":${ reusableBlock.id }} /-->`,
								clientId,
								reusableBlock.name,
								reusableBlock.title
							);
							invalidateResolution(
								'getEntityRecord',
								recordArgs
							);
						}, 100 );
						setSendFallbackMessage( false );
					} else if ( sendButtonPressMessage ) {
						timeoutId.current = setTimeout( () => {
							sendActionButtonPressedAction(
								actionButtons.missingBlockAlertActionButton
							);
						}, 100 );
						setSendButtonPressMessage( false );
					}
				} }
			>
				<View style={ styles.infoContainer }>
					<Icon
						icon={ help }
						color={ infoSheetIconStyle.color }
						size={ styles.infoSheetIcon.size }
					/>
					<Text style={ [ infoTextStyle, infoTitleStyle ] }>
						{ infoTitle }
					</Text>
				</View>
				{ ( isUnsupportedBlockEditorSupported ||
					canEnableUnsupportedBlockEditor ) && (
					<>
						<BottomSheet.Cell
							label={ reusableBlockActionButton }
							separatorType="topFullWidth"
							onPress={ requestFallback }
							labelStyle={ actionButtonStyle }
						/>
						<BottomSheet.Cell
							label={ __( 'Dismiss' ) }
							separatorType="topFullWidth"
							onPress={ closeSheet }
							labelStyle={ actionButtonStyle }
						/>
					</>
				) }
			</BottomSheet>
		);
	}

	if ( ! hasResolved ) {
		return (
			<View style={ spinnerStyle }>
				<ActivityIndicator animating />
			</View>
		);
	}

	if ( ! reusableBlock ) {
		return (
			<Text>{ __( 'Block has been deleted or is unavailable.' ) }</Text>
		);
	}

	const { title } = reusableBlock;
	let element = (
		<BlockEditorProvider
			settings={ settings }
			value={ blocks }
			onChange={ onChange }
			onInput={ onInput }
		>
			<BlockList withFooter={ false } marginHorizontal={ 0 } />
		</BlockEditorProvider>
	);

	if ( ! isEditing ) {
		element = <Disabled>{ element }</Disabled>;
	}

	return (
		<TouchableWithoutFeedback
			disabled={ ! isSelected }
			accessibilityLabel={ __( 'Help button' ) }
			accessibilityRole={ 'button' }
			accessibilityHint={ __( 'Tap here to show help' ) }
			onPress={ openSheet }
		>
			<View>
				{ isSelected && <EditTitle title={ title } /> }
				{ element }
				{ renderSheet() }
			</View>
		</TouchableWithoutFeedback>
	);
}
