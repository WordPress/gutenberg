/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup, MenuItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockIcon from '../block-icon';

const BlockTransformationsMenu = ( {
	className,
	possibleBlockTransformations,
	onSelect,
} ) => {
	return (
		<MenuGroup label={ __( 'Transform to' ) } className={ className }>
			{ possibleBlockTransformations.map( ( item ) => {
				const { name, icon, title } = item;
				return (
					<MenuItem
						key={ name }
						icon={ <BlockIcon icon={ icon } showColors /> }
						onClick={ ( event ) => {
							event.preventDefault();
							onSelect( name );
						} }
					>
						{ title }
					</MenuItem>
				);
			} ) }
		</MenuGroup>
	);
};

export default BlockTransformationsMenu;
