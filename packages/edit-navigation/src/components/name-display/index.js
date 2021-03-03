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

import { __ } from '@wordpress/i18n';
export default function NameDisplay() {
	const { menuName } = useSelectedMenuData();
	const [ , setIsMenuNameEditFocused ] = useContext(
		IsMenuNameControlFocusedContext
	);
	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					aria-label={ __( `Edit menu name:` ) + ' ' + menuName }
					onClick={ () => setIsMenuNameEditFocused( true ) }
				>
					{ menuName }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
