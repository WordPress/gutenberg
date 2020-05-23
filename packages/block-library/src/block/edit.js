/**
 * External dependencies
 */
import { partial } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	BlockControls,
	BlockEditorProvider,
	BlockList,
	WritingFlow,
} from '@wordpress/block-editor';
import { parse, serialize } from '@wordpress/blocks';
import {
	Disabled,
	Placeholder,
	Spinner,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ReusableBlockEditPanel from './edit-panel';

export default function ReusableBlockEdit( {
	attributes: { ref },
	clientId,
	isSelected,
} ) {
	const {
		reusableBlock,
		isFetching,
		isSaving,
		blocks,
		title,
		canUpdateBlock,
		settings,
	} = useSelect(
		( select ) => {
			const { canUser } = select( 'core' );
			const {
				__experimentalGetParsedReusableBlock: getParsedReusableBlock,
				getSettings,
			} = select( 'core/block-editor' );
			const {
				__experimentalGetReusableBlock: getReusableBlock,
				__experimentalIsFetchingReusableBlock: isFetchingReusableBlock,
				__experimentalIsSavingReusableBlock: isSavingReusableBlock,
			} = select( 'core/editor' );
			const _reusableBlock = getReusableBlock( ref );

			let _blocks;
			if ( _reusableBlock ) {
				if ( _reusableBlock.isTemporary ) {
					// The getParsedReusableBlock selector won't work for temporary
					// reusable blocks.
					_blocks = parse( _reusableBlock.content );
				} else {
					_blocks = getParsedReusableBlock( ref );
				}
			} else {
				_blocks = null;
			}

			return {
				reusableBlock: _reusableBlock,
				isFetching: isFetchingReusableBlock( ref ),
				isSaving: isSavingReusableBlock( ref ),
				blocks: _blocks,
				title: _reusableBlock?.title ?? null,
				canUpdateBlock:
					!! _reusableBlock &&
					! _reusableBlock.isTemporary &&
					!! canUser( 'update', 'blocks', ref ),
				settings: getSettings(),
			};
		},
		[ ref ]
	);

	const {
		__experimentalConvertBlockToStatic: convertBlockToStatic,
		__experimentalFetchReusableBlocks: fetchReusableBlocks,
		__experimentalUpdateReusableBlock: updateReusableBlock,
		__experimentalSaveReusableBlock: saveReusableBlock,
	} = useDispatch( 'core/editor' );

	const fetchReusableBlock = partial( fetchReusableBlocks, ref );
	const onChange = partial( updateReusableBlock, ref );
	const onSave = partial( saveReusableBlock, ref );

	// Start in edit mode when working with a newly created reusable block.
	// Start in preview mode when we're working with an existing reusable block.
	const [ isEditing, setIsEditing ] = useState(
		reusableBlock?.isTemporary ?? false
	);

	// Local state used for temporary (newly-created, unsaved) reusable blocks
	// and reusable blocks being edited. This state is used to make changes to
	// the block without having to save them.
	const [ localTitle, setLocalTitle ] = useState(
		reusableBlock && isEditing ? title : null
	);
	const [ localBlocks, setLocalBlocks ] = useState(
		reusableBlock && isEditing ? blocks : null
	);

	useEffect( () => {
		if ( ! reusableBlock ) {
			fetchReusableBlock();
		}
	}, [] );

	function startEditing() {
		// Copy saved reusable block data into local state.
		setLocalBlocks( blocks );
		setLocalTitle( title );

		setIsEditing( true );
	}

	function cancelEditing() {
		// Clear local state.
		setLocalBlocks( null );
		setLocalTitle( null );

		setIsEditing( false );
	}

	function saveAndStopEditing() {
		onChange( { title: localTitle, content: serialize( localBlocks ) } );
		onSave();

		// Clear local state.
		setLocalBlocks( null );
		setLocalTitle( null );

		setIsEditing( false );
	}

	if ( ! reusableBlock ) {
		if ( isFetching ) {
			return (
				<Placeholder>
					<Spinner />
				</Placeholder>
			);
		}
		return (
			<Placeholder>
				{ __( 'Block has been deleted or is unavailable.' ) }
			</Placeholder>
		);
	}

	function handleModifyBlocks( modifedBlocks ) {
		// We shouldn't change local state when the blocks are loading
		// from the saved reusable block.
		if ( isEditing ) {
			setLocalBlocks( modifedBlocks );
		}
	}

	let content = (
		<BlockEditorProvider
			settings={ settings }
			// If editing, use local state; otherwise, load the blocks from the
			// saved reusable block.
			value={ isEditing ? localBlocks : blocks }
			onChange={ handleModifyBlocks }
			onInput={ handleModifyBlocks }
		>
			<WritingFlow>
				<BlockList />
			</WritingFlow>
		</BlockEditorProvider>
	);

	if ( ! isEditing ) {
		content = <Disabled>{ content }</Disabled>;
	}

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						onClick={ () => {
							convertBlockToStatic( clientId );
						} }
					>
						{ __( 'Convert to regular blocks' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			<div className="block-library-block__reusable-block-container">
				{ ( isSelected || isEditing ) && (
					<ReusableBlockEditPanel
						isEditing={ isEditing }
						title={ isEditing ? localTitle : title }
						isSaving={
							isSaving &&
							! ( reusableBlock?.isTemporary ?? false )
						}
						isEditDisabled={ ! canUpdateBlock }
						onEdit={ startEditing }
						onChangeTitle={ ( updatedTitle ) => {
							if ( isEditing ) {
								setLocalTitle( updatedTitle );
							}
						} }
						onSave={ saveAndStopEditing }
						onCancel={ cancelEditing }
					/>
				) }
				{ content }
			</div>
		</>
	);
}
