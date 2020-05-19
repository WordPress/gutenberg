/**
 * External dependencies
 */
import { partial } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	BlockEditorProvider,
	BlockList,
	WritingFlow,
} from '@wordpress/block-editor';
import { serialize } from '@wordpress/blocks';
import { Placeholder, Spinner, Disabled } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ReusableBlockEditPanel from './edit-panel';

export default function ReusableBlockEdit( { attributes, isSelected } ) {
	const { ref } = attributes;

	const {
		reusableBlock,
		isFetching,
		isSaving,
		isTemporary,
		blocks,
		canUpdateBlock,
		settings,
		title,
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

			return {
				reusableBlock: _reusableBlock,
				isFetching: isFetchingReusableBlock( ref ),
				isSaving: isSavingReusableBlock( ref ),
				isTemporary: _reusableBlock?.isTemporary ?? null,
				blocks: _reusableBlock
					? getParsedReusableBlock( _reusableBlock.id )
					: null,
				canUpdateBlock:
					!! _reusableBlock &&
					! _reusableBlock.isTemporary &&
					!! canUser( 'update', 'blocks', ref ),
				settings: getSettings(),
				title: _reusableBlock?.title ?? null,
			};
		},
		[ ref ]
	);

	const {
		__experimentalFetchReusableBlocks: fetchReusableBlocks,
		__experimentalUpdateReusableBlock: updateReusableBlock,
		__experimentalSaveReusableBlock: saveReusableBlock,
	} = useDispatch( 'core/editor' );

	const fetchReusableBlock = partial( fetchReusableBlocks, ref );
	const onChange = partial( updateReusableBlock, ref );
	const onSave = partial( saveReusableBlock, ref );

	// Start in edit mode when working with a newly created reusable block.
	// Start in preview mode when we're working with an existing reusable block.
	const [ isEditing, setIsEditing ] = useState( isTemporary ?? false );

	// Local state used while editing so changes can be made to the reusable
	// block without having to save them.
	const [ localTitle, setLocalTitle ] = useState( isEditing ? title : null );
	const [ localBlocks, setLocalBlocks ] = useState(
		isEditing ? blocks : null
	);

	useEffect( () => {
		if ( ! reusableBlock ) {
			fetchReusableBlock();
		}
	}, [] );

	function startEditing() {
		// Copy saved reusable block data into local state.
		setLocalBlocks( blocks ?? [] );
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
		<div className="block-library-block__reusable-block-container">
			{ ( isSelected || isEditing ) && (
				<ReusableBlockEditPanel
					isEditing={ isEditing }
					title={ isEditing ? localTitle : title }
					isSaving={ isSaving && ! ( isTemporary ?? false ) }
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
	);
}
