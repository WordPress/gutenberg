/**
 * WordPress dependencies
 */
import {
	PluginMoreMenuItem as EditorPluginMoreMenuItem,
	PluginSidebar as EditorPluginSidebar,
	PluginSidebarMoreMenuItem as EditorPluginSidebarMoreMenuItem,
} from '@wordpress/editor';
import deprecated from '@wordpress/deprecated';

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
	deprecateSlot( 'PluginMoreMenuItem' );
	return <EditorPluginMoreMenuItem { ...props } />;
}

/**
 * @see PluginSidebar in @wordpress/editor package.
 */
export function PluginSidebar( props ) {
	deprecateSlot( 'PluginSidebar' );
	return <EditorPluginSidebar { ...props } />;
}

/**
 * @see PluginSidebarMoreMenuItem in @wordpress/editor package.
 */
export function PluginSidebarMoreMenuItem( props ) {
	deprecateSlot( 'PluginSidebarMoreMenuItem' );
	return <EditorPluginSidebarMoreMenuItem { ...props } />;
}
/* eslint-enable jsdoc/require-param */
