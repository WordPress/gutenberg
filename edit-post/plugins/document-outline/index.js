/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';
import { __ } from '@wordpress/i18n';
import { TableOfContentsPanel } from '@wordpress/editor';
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PluginSidebar from '../../components/sidebar/plugin-sidebar';
import PluginSidebarMoreMenuItem from '../../components/header/plugin-sidebar-more-menu-item';

function DocumentOutlinePlugin() {
	return (
		<Fragment>
			<PluginSidebar name="core/document-outline" title={ __( 'Content Structure' ) }>
				<PanelBody><TableOfContentsPanel /></PanelBody>
			</PluginSidebar>

			<PluginSidebarMoreMenuItem target="core/document-outline" icon="info-outline">
				{ __( 'Content Structure' ) }
			</PluginSidebarMoreMenuItem>
		</Fragment>
	);
}

registerPlugin( 'core-document-outline', {
	render: DocumentOutlinePlugin,
} );
