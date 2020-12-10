/**
 * External dependencies
 */
import { castArray, filter, mapKeys, orderBy, uniq } from 'lodash';

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
	getPossibleBlockTransformations,
	switchToBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { stack } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';
import BlockTransformationsMenu from './block-transformations-menu';
import BlockStylesMenu from './block-styles-menu';
import useMatchingVariationInformation from '../use-matching-variation-information';

const BlockSwitcher = ( { clientIds } ) => {
	const blocks = useSelect(
		( select ) =>
			select( 'core/block-editor' ).getBlocksByClientId( clientIds ),
		[ clientIds ]
	);
	return blocks?.length ? (
		<BlockSwitcherDropdownMenu clientIds={ clientIds } blocks={ blocks } />
	) : null;
};

const BlockSwitcherDropdownMenu = ( { clientIds, blocks } ) => {
	const { replaceBlocks } = useDispatch( 'core/block-editor' );
	const { inserterItems, hasBlockStyles } = useSelect(
		( select ) => {
			const { getBlockRootClientId, getInserterItems } = select(
				'core/block-editor'
			);
			const { getBlockStyles } = select( blocksStore );
			const rootClientId = getBlockRootClientId(
				castArray( clientIds )[ 0 ]
			);
			const firstBlock = blocks.length === 1 ? blocks[ 0 ] : null;
			const styles = firstBlock && getBlockStyles( firstBlock.name );
			return {
				inserterItems: getInserterItems( rootClientId ),
				hasBlockStyles: !! styles?.length,
			};
		},
		[ clientIds, blocks ]
	);
	const [ hoveredBlock ] = blocks;
	const blockInformation = useMatchingVariationInformation(
		hoveredBlock.clientId
	);
	const onTransform = ( name ) =>
		replaceBlocks( clientIds, switchToBlockType( blocks, name ) );

	// When selection consists of blocks of multiple types, display an
	// appropriate icon to communicate the non-uniformity.
	const isSelectionOfSameType =
		uniq( blocks.map( ( { name } ) => name ) ).length === 1;
	const icon = isSelectionOfSameType ? blockInformation.icon : stack;

	const itemsByName = mapKeys( inserterItems, ( { name } ) => name );
	const possibleBlockTransformations = orderBy(
		filter(
			getPossibleBlockTransformations( blocks ),
			( block ) => block && !! itemsByName[ block.name ]
		),
		( block ) => itemsByName[ block.name ].frecency,
		'desc'
	);
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
										<BlockStylesMenu
											hoveredBlock={ hoveredBlock }
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

export default BlockSwitcher;
