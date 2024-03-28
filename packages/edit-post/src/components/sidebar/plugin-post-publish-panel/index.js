/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { PluginPostPublishPanel } from '@wordpress/editor';

// TODO: need to add to `editor` README.md manually..
export default function EditPostPluginPostPublishPanel( props ) {
	deprecated( 'wp.editPost.PluginPostPublishPanel', {
		since: '6.6',
		version: '6.8',
		alternative: 'wp.editor.PluginPostPublishPanel',
	} );
	return <PluginPostPublishPanel { ...props } />;
}
