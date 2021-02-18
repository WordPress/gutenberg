/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import { useNavigationEditorMenu, IsMenuEditorFocused } from '../../hooks';
import { useContext } from '@wordpress/element';

export default function NameDisplay() {
	const { menuName } = useNavigationEditorMenu();
	const [ , setIsMenuNameEditFocused ] = useContext( IsMenuEditorFocused );
	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton onClick={ setIsMenuNameEditFocused }>
					{ menuName }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
