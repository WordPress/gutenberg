/**
 * WordPress dependencies
 */
import { addAction, removeAction } from '@wordpress/hooks';
import { useEffect } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';

export default function TemplateSaveDialog() {
	const registry = useRegistry();

	useEffect( () => {
		addAction(
			'editor.savePost',
			'my-plugin/template-save-dialog',
			async ( post, options ) => {
				if ( options.isAutosave ) {
					return;
				}
				if ( post.type !== 'wp_template' ) {
					return;
				}

				const site = await registry
					.select( coreStore )
					.getEntityRecord( 'root', 'site' );
				const template = await registry
					.select( coreStore )
					.getEditedEntityRecord( 'postType', post.type, post.id );

				// Already active
				if ( site.active_templates[ template.slug ] === post.id ) {
					return;
				}

				registry.dispatch( editorStore ).openPublishSidebar();
			}
		);

		return () => {
			removeAction( 'editor.savePost', 'my-plugin/template-save-dialog' );
		};
	}, [ registry ] );
}
