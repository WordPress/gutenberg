/**
 * WordPress dependencies
 */
import { layout } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { __experimentalBlockPatterns as BlockPatternsList } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PluginSidebar from '../../components/sidebar/plugin-sidebar';
import PluginSidebarMoreMenuItem from '../../components/header/plugin-sidebar-more-menu-item';

function BlockPatterns() {
	const { __experimentalBlockPatterns: blockPatterns = [] } = useSelect(
		( select ) => {
			return select( 'core/editor' ).getEditorSettings();
		},
		[]
	);

	return (
		<>
			<PluginSidebar
				icon={ layout }
				name="block-patterns-sidebar"
				title={ __( 'Block Patterns' ) }
			>
				<BlockPatternsList patterns={ blockPatterns } />
			</PluginSidebar>
			<PluginSidebarMoreMenuItem
				icon={ layout }
				target="block-patterns-sidebar"
			>
				{ __( 'Block Patterns' ) }
			</PluginSidebarMoreMenuItem>
		</>
	);
}

export default BlockPatterns;
