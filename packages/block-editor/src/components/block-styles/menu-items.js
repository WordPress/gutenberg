/**
 * WordPress dependencies
 */
import { MenuItem, __experimentalText as Text } from '@wordpress/components';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useStylesForBlocks from './use-styles-for-block';

const noop = () => {};

export default function BlockStylesMenuItems( { clientId, onSwitch = noop } ) {
	const { onSelect, stylesToRender, activeStyle } = useStylesForBlocks( {
		clientId,
		onSwitch,
	} );

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
