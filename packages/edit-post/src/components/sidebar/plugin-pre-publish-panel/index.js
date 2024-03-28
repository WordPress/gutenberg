/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { PluginPrePublishPanel } from '@wordpress/editor';

// TODO: need to add to `editor` README.md manually..
export default function EditPostPluginPrePublishPanel( props ) {
	deprecated( 'wp.editPost.PluginPrePublishPanel', {
		since: '6.6',
		version: '6.8',
		alternative: 'wp.editor.PluginPrePublishPanel',
	} );
	return <PluginPrePublishPanel { ...props } />;
}
