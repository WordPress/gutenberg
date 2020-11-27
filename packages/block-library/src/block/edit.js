/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityBlockEditor } from '@wordpress/core-data';
import { useCallback, useState } from '@wordpress/element';
import {
	Placeholder,
	Spinner,
	Disabled,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	BlockEditorProvider,
	WritingFlow,
	BlockList,
	BlockControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { store as reusableBlocksStore } from '@wordpress/reusable-blocks';

/**
 * Internal dependencies
 */
import ReusableBlockEditPanel from './edit-panel';

export default function ReusableBlockEdit( {
	attributes: { ref },
	clientId,
	isSelected,
} ) {
	const recordArgs = [ 'postType', 'wp_block', ref ];

	const {
		reusableBlock,
		hasResolved,
		isEditing,
		isSaving,
		canUserUpdate,
		settings,
	} = useSelect(
		( select ) => ( {
			reusableBlock: select( 'core' ).getEditedEntityRecord(
				...recordArgs
			),
			hasResolved: select( 'core' ).hasFinishedResolution(
				'getEditedEntityRecord',
				recordArgs
			),
			isSaving: select( 'core' ).isSavingEntityRecord( ...recordArgs ),
			canUserUpdate: select( 'core' ).canUser( 'update', 'blocks', ref ),
			isEditing: select(
				reusableBlocksStore
			).__experimentalIsEditingReusableBlock( clientId ),
			settings: select( 'core/block-editor' ).getSettings(),
		} ),
		[ ref, clientId ]
	);

	const { editEntityRecord, saveEditedEntityRecord } = useDispatch( 'core' );
	const { __experimentalSetEditingReusableBlock } = useDispatch(
		reusableBlocksStore
	);
	const setIsEditing = useCallback(
		( value ) => {
			__experimentalSetEditingReusableBlock( clientId, value );
		},
		[ clientId ]
	);

	const {
		__experimentalConvertBlockToStatic: convertBlockToStatic,
	} = useDispatch( reusableBlocksStore );

	const { createSuccessNotice, createErrorNotice } = useDispatch(
		'core/notices'
	);
	const save = useCallback( async function () {
		try {
			await saveEditedEntityRecord( ...recordArgs );
			createSuccessNotice( __( 'Block updated.' ), {
				type: 'snackbar',
			} );
		} catch ( error ) {
			createErrorNotice( error.message, {
				type: 'snackbar',
			} );
		}
	}, recordArgs );

	const [ blocks, , onChange ] = useEntityBlockEditor(
		'postType',
		'wp_block',
		{ id: ref }
	);

	// Local state used for temporary (newly-created, unsaved) reusable blocks
	// and reusable blocks being edited. This state is used to make changes to
	// the block without having to save them.
	const [ localTitle, setLocalTitle ] = useState();
	const [ localBlocks, setLocalBlocks ] = useState();

	const blockProps = useBlockProps();

	if ( ! hasResolved ) {
		return (
			<div { ...blockProps }>
				<Placeholder>
					<Spinner />
				</Placeholder>
			</div>
		);
	}

	if ( ! reusableBlock ) {
		return (
			<div { ...blockProps }>
				<Placeholder>
					{ __( 'Block has been deleted or is unavailable.' ) }
				</Placeholder>
			</div>
		);
	}

	let element = (
		<BlockEditorProvider
			value={ isEditing ? localBlocks : blocks }
			onInput={ setLocalBlocks }
			onChange={ setLocalBlocks }
			settings={ settings }
		>
			<WritingFlow>
				<BlockList />
			</WritingFlow>
		</BlockEditorProvider>
	);

	if ( ! isEditing ) {
		element = <Disabled>{ element }</Disabled>;
	}

	return (
		<div { ...blockProps }>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						onClick={ () => convertBlockToStatic( clientId ) }
					>
						{ __( 'Convert to regular blocks' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>

			<div className="block-library-block__reusable-block-container">
				{ ( isSelected || isEditing ) && (
					<ReusableBlockEditPanel
						isEditing={ isEditing }
						title={ isEditing ? localTitle : reusableBlock.title }
						isSaving={ isSaving }
						isEditDisabled={ ! canUserUpdate }
						onEdit={ () => {
							setLocalBlocks( blocks );
							setLocalTitle( reusableBlock?.title );
							setIsEditing( true );
						} }
						onChangeTitle={ setLocalTitle }
						onSave={ () => {
							onChange( localBlocks );
							editEntityRecord( ...recordArgs, {
								title: localTitle,
							} );
							save();
							setIsEditing( false );
						} }
						onCancel={ () => setIsEditing( false ) }
					/>
				) }
				{ element }
			</div>
		</div>
	);
}
