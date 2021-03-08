/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import {
	useSelectedMenuData,
	IsMenuNameControlFocusedContext,
} from '../../hooks';
import { useContext } from '@wordpress/element';

import { sprintf, __ } from '@wordpress/i18n';
export default function NameDisplay() {
	const { menuName } = useSelectedMenuData();
	const [ , setIsMenuNameEditFocused ] = useContext(
		IsMenuNameControlFocusedContext
	);
	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					aria-label={ sprintf(
						// translators: %s: the name of a menu.
						__( `Edit menu name: %s` ),
						menuName
					) }
					onClick={ () => setIsMenuNameEditFocused( true ) }
				>
					{ menuName }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
