/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import { useNavigationEditorMenu } from '../../hooks';

export default function NameDisplay( { setIsMenuNameEditFocused } ) {
	const { menuName } = useNavigationEditorMenu();
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
