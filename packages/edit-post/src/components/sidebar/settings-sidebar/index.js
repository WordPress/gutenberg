/**
 * WordPress dependencies
 */
import { BlockInspector } from '@wordpress/block-editor';
import { blockDefault } from '@wordpress/icons';
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PluginSidebarEditPost from '../../sidebar/plugin-sidebar';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

const SIDEBAR_ACTIVE_BY_DEFAULT = Platform.select( {
	web: true,
	native: false,
} );

const SettingsSidebar = () => {
	const keyboardShortcut = useSelect(
		( select ) =>
			select( 'core/keyboard-shortcuts' ).getShortcutRepresentation(
				'core/edit-post/toggle-sidebar'
			),
		[]
	);

	return (
		<PluginSidebarEditPost
			identifier={ 'edit-post/block' }
			title={ __( 'Block inspector' ) }
			header={ <strong>{ __( 'Block inspector' ) }</strong> }
			closeLabel={ __( 'Close block inspector' ) }
			toggleShortcut={ keyboardShortcut }
			icon={ blockDefault }
			isActiveByDefault={ SIDEBAR_ACTIVE_BY_DEFAULT }
		>
			<BlockInspector />
		</PluginSidebarEditPost>
	);
};

export default SettingsSidebar;
