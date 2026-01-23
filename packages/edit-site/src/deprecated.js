/**
 * WordPress dependencies
 */
import {
	PluginMoreMenuItem as EditorPluginMoreMenuItem,
	PluginSidebar as EditorPluginSidebar,
	PluginSidebarMoreMenuItem as EditorPluginSidebarMoreMenuItem,
} from '@wordpress/editor';
import { getPath } from '@wordpress/url';
import deprecated from '@wordpress/deprecated';

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
 * @see PluginMoreMenuItem in @wordpress/editor package.
 */
export function PluginMoreMenuItem( props ) {
	if ( ! isSiteEditor ) {
		return null;
	}
	deprecateSlot( 'PluginMoreMenuItem' );
	return <EditorPluginMoreMenuItem { ...props } />;
}

/**
 * @see PluginSidebar in @wordpress/editor package.
 */
export function PluginSidebar( props ) {
	if ( ! isSiteEditor ) {
		return null;
	}
	deprecateSlot( 'PluginSidebar' );
	return <EditorPluginSidebar { ...props } />;
}

/**
 * @see PluginSidebarMoreMenuItem in @wordpress/editor package.
 */
export function PluginSidebarMoreMenuItem( props ) {
	if ( ! isSiteEditor ) {
		return null;
	}
	deprecateSlot( 'PluginSidebarMoreMenuItem' );
	return <EditorPluginSidebarMoreMenuItem { ...props } />;
}
/* eslint-enable jsdoc/require-param */
