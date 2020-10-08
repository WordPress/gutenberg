/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEntityBlockEditor } from '@wordpress/core-data';
import { useState } from '@wordpress/element';
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
} from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';

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
			settings: select( 'core/block-editor' ).getSettings(),
		} ),
		[ ref ]
	);

	const { editEntityRecord, saveEditedEntityRecord } = useDispatch( 'core' );

	const { replaceBlock } = useDispatch( 'core/block-editor' );

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_block',
		{ id: ref }
	);

	const [ isEditing, setIsEditing ] = useState( false ); // TODO: Start in edit mode when newly created

	if ( ! hasResolved ) {
		return (
			<Placeholder>
				<Spinner />
			</Placeholder>
		);
	}

	if ( ! reusableBlock ) {
		return (
			<Placeholder>
				{ __( 'Block has been deleted or is unavailable.' ) }
			</Placeholder>
		);
	}

	let element = (
		<BlockEditorProvider
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
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
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						onClick={ () =>
							replaceBlock(
								clientId,
								parse( reusableBlock.content )
							)
						}
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
							saveEditedEntityRecord( ...recordArgs );
							setIsEditing( false );
						} }
					/>
				) }
				{ element }
			</div>
		</>
	);
}
