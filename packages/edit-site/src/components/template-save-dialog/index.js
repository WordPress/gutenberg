/**
 * WordPress dependencies
 */
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { addAction, removeAction } from '@wordpress/hooks';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

export default function TemplateSaveDialog() {
	const [ newActiveTemplates, setNewActiveTemplates ] = useState();
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

				setNewActiveTemplates( {
					...site.active_templates,
					[ template.slug ]: post.id,
				} );
			}
		);

		return () => {
			removeAction( 'editor.savePost', 'my-plugin/template-save-dialog' );
		};
	}, [ registry ] );

	if ( ! newActiveTemplates ) {
		return null;
	}

	return (
		<ConfirmDialog
			isOpen={ !! newActiveTemplates }
			confirmButtonText={ __( 'Activate' ) }
			cancelButtonText={ __( 'Skip' ) }
			onConfirm={ async () => {
				await registry
					.dispatch( coreStore )
					.saveEntityRecord( 'root', 'site', {
						active_templates: newActiveTemplates,
					} );
			} }
			onCancel={ () => {
				setNewActiveTemplates();
			} }
		>
			{ __( 'Do you want to activate this template?' ) }
		</ConfirmDialog>
	);
}
