/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup, MenuItem } from '@wordpress/components';
import {
	getBlockMenuDefaultClassName,
	switchToBlockType,
} from '@wordpress/blocks';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import BlockIcon from '../block-icon';
import PreviewBlockPopover from './preview-block-popover';

const BlockTransformationsMenu = ( { className, onSelect, clientIds } ) => {
	const [
		hoveredTransformItemName,
		setHoveredTransformItemName,
	] = useState();
	const { blocks, transformations } = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockTransformItems,
				getBlocksByClientId,
			} = select( blockEditorStore );

			const rootClientId = getBlockRootClientId( clientIds[ 0 ] );
			const _blocks = getBlocksByClientId( clientIds );
			return {
				blocks: _blocks,
				transformations: getBlockTransformItems(
					_blocks,
					rootClientId
				),
			};
		},
		[ clientIds ]
	);

	if ( ! transformations.length ) {
		return null;
	}

	return (
		<MenuGroup label={ __( 'Transform to' ) } className={ className }>
			{ hoveredTransformItemName && (
				<PreviewBlockPopover
					blocks={ switchToBlockType(
						blocks,
						hoveredTransformItemName
					) }
				/>
			) }
			{ transformations.map( ( item ) => {
				const { name, icon, title, isDisabled } = item;
				return (
					<MenuItem
						key={ name }
						className={ getBlockMenuDefaultClassName( name ) }
						onClick={ ( event ) => {
							event.preventDefault();
							onSelect( name );
						} }
						disabled={ isDisabled }
						onMouseLeave={ () =>
							setHoveredTransformItemName( null )
						}
						onMouseEnter={ () =>
							setHoveredTransformItemName( name )
						}
					>
						<BlockIcon icon={ icon } showColors />
						{ title }
					</MenuItem>
				);
			} ) }
		</MenuGroup>
	);
};

export default BlockTransformationsMenu;
