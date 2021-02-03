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
import { useState } from '@wordpress/element';
import { useEntityBlockEditor } from '@wordpress/core-data';
import { BottomSheet, Icon, Disabled } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { BlockEditorProvider, BlockList } from '@wordpress/block-editor';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { help } from '@wordpress/icons';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';

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
	const spinnerStyle = usePreferredColorSchemeStyle(
		styles.spinner,
		styles.spinnerDark
	);

	const { reusableBlock, hasResolved, isEditing, settings } = useSelect(
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
			};
		},
		[ ref, clientId ]
	);

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_block',
		{ id: ref }
	);

	function openSheet() {
		setShowHelp( true );
	}

	function closeSheet() {
		setShowHelp( false );
	}

	function renderSheet() {
		const infoTitle =
			Platform.OS === 'android'
				? __(
						"Reusable blocks aren't editable on WordPress for Android"
				  )
				: __( "Reusable blocks aren't editable on WordPress for iOS" );

		return (
			<BottomSheet
				isVisible={ showHelp }
				hideHeader
				onClose={ closeSheet }
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
