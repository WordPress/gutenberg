/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuGroup, MenuItem } from '@wordpress/components';

const BlockTransformationsMenu = ( {
	possibleBlockTransformations,
	onSelect,
} ) => {
	return (
		<MenuGroup>
			<div className="block-editor-block-switcher__label">
				{ __( 'Transform to' ) }
			</div>
			{ possibleBlockTransformations.map( ( item ) => {
				const { name, icon: { src: iconSrc } = {}, title } = item;
				return (
					<MenuItem
						key={ name }
						icon={ iconSrc }
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
