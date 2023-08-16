/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { forwardRef, useState } from '@wordpress/element';
import { getBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { useBlockLock } from '../block-lock';
import ListViewBlockSelectButton from './block-select-button';
import ListViewBlockInput from './block-input';
import BlockDraggable from '../block-draggable';
import { store as blockEditorStore } from '../../store';
import { useListViewContext } from './context';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import useBlockDisplayInformation from '../use-block-display-information';

const ListViewBlockContents = forwardRef(
	(
		{
			onClick,
			onToggleExpanded,
			block,
			isSelected,
			position,
			siblingBlockCount,
			level,
			isExpanded,
			selectedClientIds,
			...props
		},
		ref
	) => {
		const { clientId } = block;

		// Setting managed via `toggleLabelEditingMode` handler.
		const [ labelEditingMode, setLabelEditingMode ] = useState( false );

		const { blockMovingClientId, selectedBlockInBlockEditor } = useSelect(
			( select ) => {
				const { hasBlockMovingClientId, getSelectedBlockClientId } =
					select( blockEditorStore );
				return {
					blockMovingClientId: hasBlockMovingClientId(),
					selectedBlockInBlockEditor: getSelectedBlockClientId(),
				};
			},
			[]
		);

		const { AdditionalBlockContent, insertedBlock, setInsertedBlock } =
			useListViewContext();

		const isBlockMoveTarget =
			blockMovingClientId && selectedBlockInBlockEditor === clientId;

		// Only include all selected blocks if the currently clicked on block
		// is one of the selected blocks. This ensures that if a user attempts
		// to drag a block that isn't part of the selection, they're still able
		// to drag it and rearrange its position.
		const draggableClientIds = selectedClientIds.includes( clientId )
			? selectedClientIds
			: [ clientId ];

		const { blockName, blockAttributes } = useSelect(
			( select ) => {
				const blockObject =
					select( blockEditorStore ).getBlock( clientId );
				return {
					blockName: blockObject?.name,
					blockAttributes: blockObject?.attributes,
				};
			},
			[ clientId ]
		);

		const { updateBlockAttributes } = useDispatch( blockEditorStore );

		const metaDataSupport = getBlockSupport(
			blockName,
			'__experimentalMetadata',
			false
		);

		const supportsBlockNaming = !! (
			true === metaDataSupport || metaDataSupport?.name
		);

		const { isLocked } = useBlockLock( clientId );

		const toggleLabelEditingMode = ( value ) => {
			if ( ! supportsBlockNaming ) {
				return;
			}

			setLabelEditingMode( value );
		};

		const blockTitle = useBlockDisplayTitle( {
			clientId,
			context: 'list-view',
		} );

		const blockInformation = useBlockDisplayInformation( clientId );

		const className = classnames( 'block-editor-list-view-block-contents', {
			'is-dropping-before': isBlockMoveTarget,
			'has-block-naming-support': supportsBlockNaming,
		} );

		function inputSubmitHandler( updatedInputValue ) {
			updateBlockAttributes( clientId, {
				// Include existing metadata (if present) to avoid overwriting existing.
				metadata: {
					...( blockAttributes?.metadata &&
						blockAttributes?.metadata ),
					name: updatedInputValue,
				},
			} );
		}

		if ( labelEditingMode ) {
			return (
				<ListViewBlockInput
					ref={ ref }
					className={ className }
					onToggleExpanded={ onToggleExpanded }
					toggleLabelEditingMode={ toggleLabelEditingMode }
					blockInformation={ blockInformation }
					isLocked={ isLocked }
					blockTitle={ blockTitle }
					onSubmit={ inputSubmitHandler }
					{ ...props }
				/>
			);
		}

		return (
			<>
				{ AdditionalBlockContent && (
					<AdditionalBlockContent
						block={ block }
						insertedBlock={ insertedBlock }
						setInsertedBlock={ setInsertedBlock }
					/>
				) }
				<BlockDraggable clientIds={ draggableClientIds }>
					{ ( { draggable, onDragStart, onDragEnd } ) => (
						<ListViewBlockSelectButton
							ref={ ref }
							className={ className }
							block={ block }
							onClick={ onClick }
							onToggleExpanded={ onToggleExpanded }
							isSelected={ isSelected }
							position={ position }
							siblingBlockCount={ siblingBlockCount }
							level={ level }
							draggable={ draggable }
							onDragStart={ onDragStart }
							onDragEnd={ onDragEnd }
							isExpanded={ isExpanded }
							labelEditingMode={ labelEditingMode }
							toggleLabelEditingMode={ toggleLabelEditingMode }
							supportsBlockNaming={ supportsBlockNaming }
							blockTitle={ blockTitle }
							clientId={ clientId }
							{ ...props }
						/>
					) }
				</BlockDraggable>
			</>
		);
	}
);

export default ListViewBlockContents;
