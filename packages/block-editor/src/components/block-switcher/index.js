/**
 * External dependencies
 */
import { castArray, mapKeys, orderBy, uniq } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import {
	DropdownMenu,
	ToolbarButton,
	ToolbarGroup,
	__experimentalToolbarItem as ToolbarItem,
	MenuGroup,
	Popover,
} from '@wordpress/components';
import {
	getBlockType,
	getPossibleBlockTransformations,
	switchToBlockType,
	cloneBlock,
	getBlockFromExample,
} from '@wordpress/blocks';
import { useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { stack } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import BlockStyles from '../block-styles';
import BlockPreview from '../block-preview';
import BlockTransformationsMenu from './block-transformations-menu';

function PreviewBlockPopover( { hoveredBlock, hoveredClassName } ) {
	const hoveredBlockType = getBlockType( hoveredBlock.name );
	return (
		<div className="block-editor-block-switcher__popover__preview__parent">
			<div className="block-editor-block-switcher__popover__preview__container">
				<Popover
					className="block-editor-block-switcher__preview__popover"
					position="bottom right"
					focusOnMount={ false }
				>
					<div className="block-editor-block-switcher__preview">
						<div className="block-editor-block-switcher__preview-title">
							{ __( 'Preview' ) }
						</div>
						<BlockPreview
							viewportWidth={ 500 }
							blocks={
								hoveredBlockType.example
									? getBlockFromExample( hoveredBlock.name, {
											attributes: {
												...hoveredBlockType.example
													.attributes,
												className: hoveredClassName,
											},
											innerBlocks:
												hoveredBlockType.example
													.innerBlocks,
									  } )
									: cloneBlock( hoveredBlock, {
											className: hoveredClassName,
									  } )
							}
						/>
					</div>
				</Popover>
			</div>
		</div>
	);
}

export default function BlockSwitcher( { clientIds } ) {
	const [ hoveredClassName, setHoveredClassName ] = useState();

	const { blocks, inserterItems, hasBlockStyles } = useSelect(
		( select ) => {
			const {
				getBlocksByClientId,
				getBlockRootClientId,
				getInserterItems,
			} = select( 'core/block-editor' );

			const { getBlockStyles } = select( 'core/blocks' );
			const rootClientId = getBlockRootClientId(
				castArray( clientIds )[ 0 ]
			);

			const selectedBlocks = getBlocksByClientId( clientIds );
			const firstBlock =
				selectedBlocks && selectedBlocks.length === 1
					? selectedBlocks[ 0 ]
					: null;
			const styles = firstBlock && getBlockStyles( firstBlock.name );

			return {
				blocks: selectedBlocks,
				inserterItems: getInserterItems( rootClientId ),
				hasBlockStyles: styles && styles.length > 0,
			};
		},
		[ clientIds ]
	);

	const { replaceBlocks } = useDispatch( 'core/block-editor' );

	const onTransform = ( name ) => {
		replaceBlocks( clientIds, switchToBlockType( blocks, name ) );
	};

	if ( ! Array.isArray( blocks ) || ! blocks.length ) {
		return null;
	}

	const [ hoveredBlock ] = blocks;
	const itemsByName = mapKeys( inserterItems, ( { name } ) => name );
	const possibleBlockTransformations = orderBy(
		getPossibleBlockTransformations( blocks ).filter(
			( block ) => block && !! itemsByName[ block.name ]
		),
		( block ) => itemsByName[ block.name ].frecency,
		'desc'
	);

	// When selection consists of blocks of multiple types, display an
	// appropriate icon to communicate the non-uniformity.
	const isSelectionOfSameType =
		uniq( blocks.map( ( block ) => block.name ) ).length === 1;

	let icon;
	if ( isSelectionOfSameType ) {
		const sourceBlockName = hoveredBlock.name;
		const blockType = getBlockType( sourceBlockName );
		icon = blockType.icon;
	} else {
		icon = stack;
	}

	const hasPossibleBlockTransformations = !! possibleBlockTransformations.length;

	if ( ! hasBlockStyles && ! hasPossibleBlockTransformations ) {
		return (
			<ToolbarGroup>
				<ToolbarButton
					disabled
					className="block-editor-block-switcher__no-switcher-icon"
					title={ __( 'Block icon' ) }
					icon={ <BlockIcon icon={ icon } showColors /> }
				/>
			</ToolbarGroup>
		);
	}

	const blockSwitcherLabel =
		1 === blocks.length
			? __( 'Change block type or style' )
			: sprintf(
					/* translators: %s: number of blocks. */
					_n(
						'Change type of %d block',
						'Change type of %d blocks',
						blocks.length
					),
					blocks.length
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
							<BlockIcon
								icon={ icon }
								className="block-editor-block-switcher__toggle"
								showColors
							/>
						}
						toggleProps={ toggleProps }
						menuProps={ { orientation: 'both' } }
					>
						{ ( { onClose } ) =>
							( hasBlockStyles ||
								hasPossibleBlockTransformations ) && (
								<div className="block-editor-block-switcher__container">
									{ hasPossibleBlockTransformations && (
										<BlockTransformationsMenu
											className="block-editor-block-switcher__transforms__menugroup"
											possibleBlockTransformations={
												possibleBlockTransformations
											}
											onSelect={ ( name ) => {
												onTransform( name );
												onClose();
											} }
										/>
									) }
									{ hasBlockStyles && (
										<MenuGroup
											label={ __( 'Styles' ) }
											className="block-editor-block-switcher__styles__menugroup"
										>
											{ hoveredClassName !== null && (
												<PreviewBlockPopover
													hoveredBlock={
														hoveredBlock
													}
													hoveredClassName={
														hoveredClassName
													}
												/>
											) }
											<BlockStyles
												clientId={
													hoveredBlock.clientId
												}
												onSwitch={ onClose }
												onHoverClassName={
													setHoveredClassName
												}
												itemRole="menuitem"
											/>
										</MenuGroup>
									) }
								</div>
							)
						}
					</DropdownMenu>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
}
