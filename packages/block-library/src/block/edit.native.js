/**
 * External dependencies
 */
import { ActivityIndicator, Alert, Text, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect, useCallback } from '@wordpress/element';
import {
	useEntityBlockEditor,
	useEntityProp,
	store as coreStore,
} from '@wordpress/core-data';
import {
	Disabled,
	ToolbarButton,
	TextControl,
	PanelBody,
	Icon,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import {
	InnerBlocks,
	BlockControls,
	InspectorControls,
	FloatingToolbarButtons,
	useFloatingToolbarAnimationsContext,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';
import { store as noticesStore } from '@wordpress/notices';
import { ungroup, check, close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

function ReusableBlockEdit( { attributes: { ref }, clientId, isSelected } ) {
	const recordArgs = [ 'postType', 'wp_block', ref ];

	const [ isEditing, setIsEditing ] = useState( false );
	const originalValue = useRef();
	const alertShown = useRef( false );

	const spinnerStyle = usePreferredColorSchemeStyle(
		styles.spinner,
		styles.spinnerDark
	);

	const {
		shake: floatingToolbarShake,
	} = useFloatingToolbarAnimationsContext();

	const {
		originalReusableBlock,
		reusableBlock,
		hasEdits,
		hasResolved,
		isSaving,
		edits,
		hasSelectedInnerBlock,
	} = useSelect(
		( select ) => {
			const { getSettings } = select( blockEditorStore );

			return {
				originalReusableBlock: select( coreStore ).getEntityRecord(
					...recordArgs
				),
				reusableBlock: select( coreStore ).getEditedEntityRecord(
					...recordArgs
				),
				edits: select( coreStore ).getEntityRecordEdits(
					...recordArgs
				),
				hasEdits: select( coreStore ).hasEditsForEntityRecord(
					...recordArgs
				),
				hasResolved: select( coreStore ).hasFinishedResolution(
					'getEditedEntityRecord',
					recordArgs
				),
				isSaving: select( coreStore ).isSavingEntityRecord(
					...recordArgs
				),
				canUserUpdate: select( coreStore ).canUser(
					'update',
					'blocks',
					ref
				),
				isEditing: select(
					reusableBlocksStore
				).__experimentalIsEditingReusableBlock( clientId ),
				settings: getSettings(),
				hasSelectedInnerBlock: select(
					blockEditorStore
				).hasSelectedInnerBlock( clientId ),
			};
		},
		[ ref, clientId ]
	);

	const { saveEditedEntityRecord, editEntityRecord } = useDispatch(
		coreStore
	);

	const { selectBlock } = useDispatch( blockEditorStore );

	const { createNotice } = useDispatch( noticesStore );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_block',
		{ id: ref }
	);

	const [ title, editTitle, fullTitle ] = useEntityProp(
		'postType',
		'wp_block',
		'title',
		ref
	);

	/* translators: Changes saved notice message. %s: The reusable block name */
	const saveMessageFormat = __( "Changes to '%s' saved" );
	const saveMessage = sprintf( saveMessageFormat, title );
	/* translators: Changes discarded notice message. %s: The reusable block name */
	const discardMessageFormat = __( "Changes to '%s' discarded" );
	const discardMessage = sprintf( discardMessageFormat, title );
	/* translators: Unsaved changes alert title. */
	const unsavedChangesTitle = __( 'Unsaved changes' );
	/* translators: Unsaved changes alert message. %s: The reusable block name */
	const unsavedChangesMessageFormat = __(
		"Would you like to save or discard the changes in ''%s'?"
	);
	const unsavedChangesMessage = sprintf( unsavedChangesMessageFormat, title );
	/* translators: Convert to regular blocks notice message. %s: The reusable block name */
	const convertToRegularFormat = __( "''%s' converted to regular blocks" );
	const convertToRegular = sprintf( convertToRegularFormat, title );

	const setTitle = ( value ) => {
		editTitle( value );
		if ( value !== fullTitle.raw && ! isEditing ) {
			originalValue.current = { title, ...edits };
			setIsEditing( true );
		}
	};

	const {
		__experimentalConvertBlockToStatic: convertBlockToStatic,
	} = useDispatch( reusableBlocksStore );

	// Handlers
	const enableEditMode = () => {
		originalValue.current = { title, ...edits };
		setIsEditing( true );
	};

	const disableEditMode = () => {
		setIsEditing( false );
		if ( hasSelectedInnerBlock ) selectBlock( clientId );
	};

	const discardChanges = () => {
		const emptyEdit = Object.keys( edits ).reduce(
			( carry, item ) => ( {
				...carry,
				[ item ]: originalValue.current[ item ],
			} ),
			{}
		);
		editEntityRecord( ...recordArgs, emptyEdit );
		disableEditMode();
		createNotice( 'info', discardMessage );
	};

	const saveChanges = () => {
		saveEditedEntityRecord( ...recordArgs );
		disableEditMode();
		createNotice( 'info', saveMessage );
	};

	const convertToRegularBlocks = () => {
		createNotice( 'info', convertToRegular );
		convertBlockToStatic( clientId );
	};

	const shakeFloatingToolbar = useCallback(
		() => floatingToolbarShake.getAnimation().start(),
		[ floatingToolbarShake ]
	);

	// Unsaved changes alert
	useEffect( () => {
		if (
			isEditing &&
			! ( isSelected || hasSelectedInnerBlock ) &&
			! alertShown.current
		) {
			alertShown.current = true;

			setImmediate( () =>
				Alert.alert(
					unsavedChangesTitle,
					unsavedChangesMessage,
					[
						{
							text: __( 'Discard' ),
							onPress: () => {
								alertShown.current = false;
								discardChanges();
							},
							style: 'cancel',
						},
						{
							text: __( 'Save' ),
							onPress: () => {
								alertShown.current = false;
								saveChanges();
							},
							style: 'default',
						},
					],
					{ cancelable: false }
				)
			);
		}
	}, [ isSelected, hasSelectedInnerBlock ] );

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

	return (
		<View>
			<BlockControls group="other">
				<ToolbarButton
					onClick={ convertToRegularBlocks }
					label={ __( 'Convert to regular blocks' ) }
					icon={ ungroup }
					showTooltip
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Reusable block settings' ) }>
					<TextControl
						label={ __( 'Name' ) }
						value={ title }
						onChange={ setTitle }
						help={ __(
							'Updates to block name are applied when changes to the block are saved'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			{ isSelected && ! isEditing && ! isSaving && (
				<FloatingToolbarButtons>
					<ToolbarButton
						title={ __( 'Edit' ) }
						onClick={ enableEditMode }
					>
						<Text style={ styles.editButton }>
							{ __( 'Edit' ) }
						</Text>
					</ToolbarButton>
				</FloatingToolbarButtons>
			) }
			{ isEditing && (
				<FloatingToolbarButtons>
					<ToolbarButton
						title={ __( 'Discard' ) }
						onClick={ discardChanges }
						icon={ <Icon icon={ close } fill={ '#FF0000' } /> }
						style={ { backgroundColor: 'red' } }
					/>
					<ToolbarButton
						title={ __( 'Save' ) }
						onClick={ saveChanges }
						icon={ <Icon icon={ check } fill={ '#00FF00' } /> }
					/>
				</FloatingToolbarButtons>
			) }
			{ isSaving && (
				<FloatingToolbarButtons>
					<ActivityIndicator style={ styles.toolbarSpinner } />
				</FloatingToolbarButtons>
			) }
			<View>
				<Disabled
					isDisabled={ isSelected && ( ! isEditing || isSaving ) }
					onPressDisabled={ shakeFloatingToolbar }
				>
					<InnerBlocks
						value={ blocks }
						onChange={ onChange }
						onInput={ onInput }
					/>
				</Disabled>
			</View>
		</View>
	);
}

export default ReusableBlockEdit;
