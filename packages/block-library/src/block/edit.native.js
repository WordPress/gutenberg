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
import { useState, useCallback } from '@wordpress/element';
import {
	useEntityBlockEditor,
	useEntityProp,
	store as coreStore,
} from '@wordpress/core-data';
import {
	BottomSheet,
	Icon,
	Disabled,
	TextControl,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalRecursionProvider as RecursionProvider,
	__experimentalUseHasRecursion as useHasRecursion,
	InnerBlocks,
	Warning,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { help } from '@wordpress/icons';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';
import { store as editorStore } from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';

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
	const hasAlreadyRendered = useHasRecursion( ref );

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
	const infoDescriptionStyle = usePreferredColorSchemeStyle(
		styles.infoDescription,
		styles.infoDescriptionDark
	);
	const actionButtonStyle = usePreferredColorSchemeStyle(
		styles.actionButton,
		styles.actionButtonDark
	);
	const spinnerStyle = usePreferredColorSchemeStyle(
		styles.spinner,
		styles.spinnerDark
	);

	const { hasResolved, isEditing, isMissing, innerBlockCount } = useSelect(
		( select ) => {
			const persistedBlock = select( coreStore ).getEntityRecord(
				'postType',
				'wp_block',
				ref
			);
			const hasResolvedBlock = select( coreStore ).hasFinishedResolution(
				'getEntityRecord',
				[ 'postType', 'wp_block', ref ]
			);

			const { getBlockCount } = select( blockEditorStore );

			return {
				hasResolved: hasResolvedBlock,
				isEditing:
					select(
						reusableBlocksStore
					).__experimentalIsEditingReusableBlock( clientId ),
				isMissing: hasResolvedBlock && ! persistedBlock,
				innerBlockCount: getBlockCount( clientId ),
			};
		},
		[ ref, clientId ]
	);
	const hostAppNamespace = useSelect(
		( select ) =>
			select( editorStore ).getEditorSettings().hostAppNamespace,
		[]
	);

	const { createSuccessNotice } = useDispatch( noticesStore );
	const { __experimentalConvertBlockToStatic: convertBlockToStatic } =
		useDispatch( reusableBlocksStore );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_block',
		{ id: ref }
	);

	const [ title ] = useEntityProp( 'postType', 'wp_block', 'title', ref );

	function openSheet() {
		setShowHelp( true );
	}

	function closeSheet() {
		setShowHelp( false );
	}

	const onConvertToRegularBlocks = useCallback( () => {
		/* translators: %s: name of the synced block */
		const successNotice = __( '%s detached' );
		createSuccessNotice( sprintf( successNotice, title ) );

		clearSelectedBlock();
		// Convert action is executed at the end of the current JavaScript execution block
		// to prevent issues related to undo/redo actions.
		setImmediate( () => convertBlockToStatic( clientId ) );
	}, [ title, clientId ] );

	function renderSheet() {
		const infoTitle =
			Platform.OS === 'android'
				? sprintf(
						/* translators: %s: name of the host app (e.g. WordPress) */
						__(
							'Editing synced patterns is not yet supported on %s for Android'
						),
						hostAppNamespace
				  )
				: sprintf(
						/* translators: %s: name of the host app (e.g. WordPress) */
						__(
							'Editing synced patterns is not yet supported on %s for iOS'
						),
						hostAppNamespace
				  );

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
					<Text style={ [ infoTextStyle, infoDescriptionStyle ] }>
						{ innerBlockCount > 1
							? __(
									'Alternatively, you can detach and edit these blocks separately by tapping “Detach patterns”.'
							  )
							: __(
									'Alternatively, you can detach and edit this block separately by tapping “Detach pattern”.'
							  ) }
					</Text>
					<TextControl
						label={
							innerBlockCount > 1
								? __( 'Detach patterns' )
								: __( 'Detach pattern' )
						}
						separatorType="topFullWidth"
						onPress={ onConvertToRegularBlocks }
						labelStyle={ actionButtonStyle }
					/>
				</View>
			</BottomSheet>
		);
	}

	if ( hasAlreadyRendered ) {
		return (
			<Warning
				message={ __( 'Block cannot be rendered inside itself.' ) }
			/>
		);
	}

	if ( isMissing ) {
		return (
			<Warning
				message={ __( 'Block has been deleted or is unavailable.' ) }
			/>
		);
	}

	if ( ! hasResolved ) {
		return (
			<View style={ spinnerStyle }>
				<ActivityIndicator animating />
			</View>
		);
	}

	let element = (
		<InnerBlocks
			value={ blocks }
			onChange={ onChange }
			onInput={ onInput }
		/>
	);

	if ( ! isEditing ) {
		element = <Disabled>{ element }</Disabled>;
	}

	return (
		<RecursionProvider uniqueId={ ref }>
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
		</RecursionProvider>
	);
}
