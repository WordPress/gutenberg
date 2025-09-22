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
	const [ isOpen, setIsOpen ] = useState();
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

				try {
					await new Promise( ( resolve, reject ) => {
						setIsOpen( { resolve, reject } );
					} );
				} catch ( error ) {
					// User cancelled, don't activate template
					return;
				} finally {
					setIsOpen();
				}

				// Only activate template if user confirmed
				await registry
					.dispatch( coreStore )
					.saveEntityRecord( 'root', 'site', {
						active_templates: {
							...site.active_templates,
							[ template.slug ]: post.id,
						},
					} );
			}
		);

		return () => {
			removeAction( 'editor.savePost', 'my-plugin/template-save-dialog' );
		};
	}, [ registry ] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<ConfirmDialog
			isOpen={ isOpen }
			confirmButtonText={ __( 'Activate' ) }
			cancelButtonText={ __( 'Cancel' ) }
			onConfirm={ () => {
				isOpen.resolve();
			} }
			onCancel={ () => {
				isOpen.reject();
			} }
		>
			{ __( 'Do you want to activate this template?' ) }
		</ConfirmDialog>
	);
}
