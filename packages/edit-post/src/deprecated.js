/**
 * WordPress dependencies
 */
import {
	privateApis as editorPrivateApis,
	PluginBlockSettingsMenuItem as EditorPluginBlockSettingsMenuItem,
	PluginDocumentSettingPanel as EditorPluginDocumentSettingPanel,
	PluginMoreMenuItem as EditorPluginMoreMenuItem,
	PluginPrePublishPanel as EditorPluginPrePublishPanel,
	PluginPostPublishPanel as EditorPluginPostPublishPanel,
	PluginPostStatusInfo as EditorPluginPostStatusInfo,
	PluginSidebar as EditorPluginSidebar,
	PluginSidebarMoreMenuItem as EditorPluginSidebarMoreMenuItem,
} from '@wordpress/editor';
import { getPath } from '@wordpress/url';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';
const { PluginPostExcerpt } = unlock( editorPrivateApis );

const isSiteEditor = getPath( window.location.href )?.includes(
	'site-editor.php'
);

const deprecateSlot = ( name ) => {
	deprecated( `wp.editPost.${ name }`, {
		since: '6.6',
		alternative: `wp.editor.${ name }`,
	} );
};

/* eslint-disable jsdoc/require-param */
/**
 * @see PluginBlockSettingsMenuItem in @wordpress/editor package.
 */
export function PluginBlockSettingsMenuItem( props ) {
	if ( isSiteEditor ) {
		return null;
	}
	deprecateSlot( 'PluginBlockSettingsMenuItem' );
	return <EditorPluginBlockSettingsMenuItem { ...props } />;
}

/**
 * @see PluginDocumentSettingPanel in @wordpress/editor package.
 */
export function PluginDocumentSettingPanel( props ) {
	if ( isSiteEditor ) {
		return null;
	}
	deprecateSlot( 'PluginDocumentSettingPanel' );
	return <EditorPluginDocumentSettingPanel { ...props } />;
}

/**
 * @see PluginMoreMenuItem in @wordpress/editor package.
 */
export function PluginMoreMenuItem( props ) {
	if ( isSiteEditor ) {
		return null;
	}
	deprecateSlot( 'PluginMoreMenuItem' );
	return <EditorPluginMoreMenuItem { ...props } />;
}

/**
 * @see PluginPrePublishPanel in @wordpress/editor package.
 */
export function PluginPrePublishPanel( props ) {
	if ( isSiteEditor ) {
		return null;
	}
	deprecateSlot( 'PluginPrePublishPanel' );
	return <EditorPluginPrePublishPanel { ...props } />;
}

/**
 * @see PluginPostPublishPanel in @wordpress/editor package.
 */
export function PluginPostPublishPanel( props ) {
	if ( isSiteEditor ) {
		return null;
	}
	deprecateSlot( 'PluginPostPublishPanel' );
	return <EditorPluginPostPublishPanel { ...props } />;
}

/**
 * @see PluginPostStatusInfo in @wordpress/editor package.
 */
export function PluginPostStatusInfo( props ) {
	if ( isSiteEditor ) {
		return null;
	}
	deprecateSlot( 'PluginPostStatusInfo' );
	return <EditorPluginPostStatusInfo { ...props } />;
}

/**
 * @see PluginSidebar in @wordpress/editor package.
 */
export function PluginSidebar( props ) {
	if ( isSiteEditor ) {
		return null;
	}
	deprecateSlot( 'PluginSidebar' );
	return <EditorPluginSidebar { ...props } />;
}

/**
 * @see PluginSidebarMoreMenuItem in @wordpress/editor package.
 */
export function PluginSidebarMoreMenuItem( props ) {
	if ( isSiteEditor ) {
		return null;
	}
	deprecateSlot( 'PluginSidebarMoreMenuItem' );
	return <EditorPluginSidebarMoreMenuItem { ...props } />;
}

/**
 * @see PluginPostExcerpt in @wordpress/editor package.
 */
export function __experimentalPluginPostExcerpt() {
	if ( isSiteEditor ) {
		return null;
	}
	deprecated( 'wp.editPost.__experimentalPluginPostExcerpt', {
		since: '6.6',
		hint: 'Core and custom panels can be access programmatically using their panel name.',
		link: 'https://developer.wordpress.org/block-editor/reference-guides/slotfills/plugin-document-setting-panel/#accessing-a-panel-programmatically',
	} );
	return PluginPostExcerpt;
}

/* eslint-enable jsdoc/require-param */
