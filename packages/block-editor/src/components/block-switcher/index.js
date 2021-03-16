/**
 * External dependencies
 */
import { castArray, uniq } from 'lodash';

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

export const BlockSwitcherDropdownMenu = ( { clientIds, blocks } ) => {
	const { replaceBlocks } = useDispatch( blockEditorStore );
	const blockInformation = useBlockDisplayInformation( blocks[ 0 ].clientId );
	const {
		possibleBlockTransformations,
		hasBlockStyles,
		icon,
		blockTitle,
		patterns,
		replaceMode,
	} = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockTransformItems,
				__experimentalGetPatternTransformItems,
			} = select( blockEditorStore );

			const { getBlockStyles, getBlockType } = select( blocksStore );
			const rootClientId = getBlockRootClientId(
				castArray( clientIds )[ 0 ]
			);
			const [ { name: firstBlockName } ] = blocks;
			const _isSingleBlockSelected = blocks.length === 1;
			const styles =
				_isSingleBlockSelected && getBlockStyles( firstBlockName );
			let _icon;
			if ( _isSingleBlockSelected ) {
				_icon = blockInformation?.icon; // Take into account active block variations.
			} else {
				const isSelectionOfSameType =
					uniq( blocks.map( ( { name } ) => name ) ).length === 1;
				// When selection consists of blocks of multiple types, display an
				// appropriate icon to communicate the non-uniformity.
				_icon = isSelectionOfSameType
					? getBlockType( firstBlockName )?.icon
					: stack;
			}
			const _patterns = __experimentalGetPatternTransformItems(
				blocks,
				rootClientId
			);
			return {
				possibleBlockTransformations: getBlockTransformItems(
					blocks,
					rootClientId
				),
				hasBlockStyles: !! styles?.length,
				icon: _icon,
				blockTitle: getBlockType( firstBlockName ).title,
				patterns: _patterns,
				// Need more thought here.
				replaceMode:
					_isSingleBlockSelected &&
					firstBlockName === 'core/template-part',
			};
		},
		[ clientIds, blocks, blockInformation?.icon ]
	);

	const isReusable = blocks.length === 1 && isReusableBlock( blocks[ 0 ] );
	const isTemplate = blocks.length === 1 && isTemplatePart( blocks[ 0 ] );

	const onBlockTransform = ( name ) =>
		replaceBlocks( clientIds, switchToBlockType( blocks, name ) );
	// TODO comments (for the above too).
	const onPatternTransform = ( transformedBlocks ) => {
		// If on replaceMode (currently single Template Part block selected)
		// we probably have to create a new Template part.
		// This is not implemented yet!!
		if ( ! replaceMode ) {
			replaceBlocks( clientIds, transformedBlocks );
		} else {
			// Handle Template Parts change/creation flow.
		}
	};
	const hasPossibleBlockTransformations = !! possibleBlockTransformations.length;
	const hasPatternTransformation = !! patterns?.length;
	if ( ! hasBlockStyles && ! hasPossibleBlockTransformations ) {
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

	const showDropDown =
		hasBlockStyles ||
		hasPossibleBlockTransformations ||
		hasPatternTransformation;
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
										<BlockTitle clientId={ clientIds } />
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
						{ ( { onClose } ) =>
							showDropDown && (
								<div className="block-editor-block-switcher__container">
									{ hasPatternTransformation && (
										<PatternTransformationsMenu
											blocks={ blocks }
											patterns={ patterns }
											onSelect={ (
												transformedBlocks
											) => {
												onPatternTransform(
													transformedBlocks
												);
												onClose();
											} }
											replaceMode={ replaceMode }
										/>
									) }
									{ hasPossibleBlockTransformations && (
										<BlockTransformationsMenu
											className="block-editor-block-switcher__transforms__menugroup"
											possibleBlockTransformations={
												possibleBlockTransformations
											}
											blocks={ blocks }
											onSelect={ ( name ) => {
												onBlockTransform( name );
												onClose();
											} }
										/>
									) }
									{ hasBlockStyles && (
										<BlockStylesMenu
											hoveredBlock={ blocks[ 0 ] }
											onSwitch={ onClose }
										/>
									) }
								</div>
							)
						}
					</DropdownMenu>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
};

export const BlockSwitcher = ( { clientIds } ) => {
	const blocks = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlocksByClientId( clientIds ),
		[ clientIds ]
	);

	if ( ! blocks.length || blocks.some( ( block ) => ! block ) ) {
		return null;
	}

	return (
		<BlockSwitcherDropdownMenu clientIds={ clientIds } blocks={ blocks } />
	);
};

export default BlockSwitcher;
