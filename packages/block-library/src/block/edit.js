/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityBlockEditor } from '@wordpress/core-data';
import { useCallback } from '@wordpress/element';
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

	const { clearSelectedBlock } = useDispatch( 'core/block-editor' );
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

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_block',
		{ id: ref }
	);

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

	/**
	 * Clear the selected block when focus moves to the reusable block list.
	 * These blocks are in different stores and only one block should be
	 * selected at a time.
	 */
	function onFocus() {
		clearSelectedBlock();
	}

	let element = (
		<BlockEditorProvider
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			settings={ settings }
		>
			<div className="block-editor-block-list__block" onFocus={ onFocus }>
				<WritingFlow>
					<BlockList />
				</WritingFlow>
			</div>
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
						title={ reusableBlock.title }
						isSaving={ isSaving }
						isEditDisabled={ ! canUserUpdate }
						onEdit={ () => setIsEditing( true ) }
						onChangeTitle={ ( title ) =>
							editEntityRecord( ...recordArgs, { title } )
						}
						onSave={ () => {
							save();
							setIsEditing( false );
						} }
					/>
				) }
				{ element }
			</div>
		</div>
	);
}
