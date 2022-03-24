/**
 * External dependencies
 */
import { uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	DropdownMenu,
	ToolbarButton,
	ToolbarGroup,
	ToolbarItem,
} from '@wordpress/components';
import {
	switchToBlockType,
	store as blocksStore,
	isReusableBlock,
	isTemplatePart,
} from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { stack } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import useBlockDisplayInformation from '../use-block-display-information';
import BlockIcon from '../block-icon';
import BlockTitle from '../block-title';
import BlockTransformationsMenu from './block-transformations-menu';
import BlockStylesMenu from './block-styles-menu';
import PatternTransformationsMenu from './pattern-transformations-menu';

export const BlockSwitcherDropdownMenu = ( { clientIds } ) => {
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const blockInformation = useBlockDisplayInformation( clientIds[ 0 ] );
	const { canRemove, icon, blockTitle, isReusable, isTemplate } = useSelect(
		( select ) => {
			const { getBlockRootClientId } = select( blockEditorStore );
			const { getBlockType } = select( blocksStore );
			const { canRemoveBlocks, getBlockName } = select(
				blockEditorStore
			);
			const rootClientId = getBlockRootClientId( clientIds[ 0 ] );
			const blockNames = clientIds.map( getBlockName );
			const firstBlockName = blockNames[ 0 ];
			const _isSingleBlockSelected = clientIds.length === 1;
			let _icon;
			if ( _isSingleBlockSelected ) {
				_icon = blockInformation?.icon; // Take into account active block variations.
			} else {
				const isSelectionOfSameType = uniq( blockNames ).length === 1;
				// When selection consists of blocks of multiple types, display an
				// appropriate icon to communicate the non-uniformity.
				_icon = isSelectionOfSameType
					? getBlockType( firstBlockName )?.icon
					: stack;
			}
			const _canRemove = canRemoveBlocks( clientIds, rootClientId );
			return {
				canRemove: _canRemove,
				icon: _icon,
				blockTitle: getBlockType( firstBlockName )?.title,
				isReusable:
					_isSingleBlockSelected &&
					isReusableBlock( { name: firstBlockName } ),
				isTemplate:
					_isSingleBlockSelected &&
					isTemplatePart( { name: firstBlockName } ),
			};
		},
		[ clientIds, blockInformation?.icon ]
	);

	const { getBlocksByClientId } = useSelect( blockEditorStore );

	// Simple block tranformation based on the `Block Transforms` API.
	const onBlockTransform = ( name ) =>
		replaceBlocks(
			clientIds,
			switchToBlockType( getBlocksByClientId( clientIds ), name )
		);
	// Pattern transformation through the `Patterns` API.
	const onPatternTransform = ( transformedBlocks ) =>
		replaceBlocks( clientIds, transformedBlocks );

	const showDropDown = canRemove;

	if ( ! showDropDown ) {
		return (
			<ToolbarGroup>
				<ToolbarButton
					disabled
					className="block-editor-block-switcher__no-switcher-icon"
					title={ blockTitle }
					icon={ <BlockIcon icon={ icon } showColors /> }
				/>
			</ToolbarGroup>
		);
	}

	const blockSwitcherLabel = blockTitle;

	const blockSwitcherDescription =
		1 === clientIds.length
			? sprintf(
					/* translators: %s: block title. */
					__( '%s: Change block type or style' ),
					blockTitle
			  )
			: sprintf(
					/* translators: %d: number of blocks. */
					_n(
						'Change type of %d block',
						'Change type of %d blocks',
						clientIds.length
					),
					clientIds.length
			  );

	return (
		<ToolbarGroup>
			<ToolbarItem>
				{ ( toggleProps ) => (
					<DropdownMenu
						className="block-editor-block-switcher"
						label={ blockSwitcherLabel }
						popoverProps={ {
							position: 'bottom right',
							isAlternate: true,
							className: 'block-editor-block-switcher__popover',
						} }
						icon={
							<>
								<BlockIcon
									icon={ icon }
									className="block-editor-block-switcher__toggle"
									showColors
								/>
								{ ( isReusable || isTemplate ) && (
									<span className="block-editor-block-switcher__toggle-text">
										<BlockTitle
											clientId={ clientIds }
											maximumLength={ 35 }
										/>
									</span>
								) }
							</>
						}
						toggleProps={ {
							describedBy: blockSwitcherDescription,
							...toggleProps,
						} }
						menuProps={ { orientation: 'both' } }
					>
						{ ( { onClose } ) => (
							<div className="block-editor-block-switcher__container">
								<PatternTransformationsMenu
									clientIds={ clientIds }
									onSelect={ ( transformedBlocks ) => {
										onPatternTransform( transformedBlocks );
										onClose();
									} }
								/>
								<BlockTransformationsMenu
									className="block-editor-block-switcher__transforms__menugroup"
									clientIds={ clientIds }
									onSelect={ ( name ) => {
										onBlockTransform( name );
										onClose();
									} }
								/>
								{ clientIds.length === 1 && (
									<BlockStylesMenu
										hoveredBlockClientId={ clientIds[ 0 ] }
										onSwitch={ onClose }
									/>
								) }
							</div>
						) }
					</DropdownMenu>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
};

export const BlockSwitcher = ( { clientIds } ) => {
	if ( ! clientIds || ! clientIds.length ) {
		return null;
	}

	return <BlockSwitcherDropdownMenu clientIds={ clientIds } />;
};

export default BlockSwitcher;
