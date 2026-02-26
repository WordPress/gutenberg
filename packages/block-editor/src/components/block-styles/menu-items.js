/**
 * WordPress dependencies
 */
import { MenuItem, __experimentalText as Text } from '@wordpress/components';
import { check } from '@wordpress/icons';

const noop = () => {};

export default function BlockStylesMenuItems( {
	stylesToRender,
	activeStyle,
	onSelect = noop,
	onHoverStyle = noop,
} ) {
	if ( ! stylesToRender || stylesToRender.length === 0 ) {
		return null;
	}
	return (
		<>
			{ stylesToRender.map( ( style ) => {
				const menuItemText = style.label || style.name;
				return (
					<MenuItem
						key={ style.name }
						icon={ activeStyle.name === style.name ? check : null }
						onClick={ () => onSelect( style ) }
						onMouseEnter={ () => onHoverStyle( style ) }
						onMouseLeave={ () => onHoverStyle( null ) }
					>
						<Text
							as="span"
							limit={ 18 }
							ellipsizeMode="tail"
							truncate
						>
							{ menuItemText }
						</Text>
					</MenuItem>
				);
			} ) }
		</>
	);
}
