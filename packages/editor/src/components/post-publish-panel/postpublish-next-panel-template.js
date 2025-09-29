/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useRegistry, useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function focusRef( node ) {
	node?.focus();
}

export function PostPublishNextPanelTemplate( { post, focusOnMount } ) {
	const postTitle = decodeEntities( post.title ) || __( '(no title)' );
	const registry = useRegistry();
	const { isActivating } = useSelect( ( select ) => {
		const { isSavingEntityRecord } = select( coreStore );
		return {
			isActivating: isSavingEntityRecord( 'root', 'site' ),
		};
	} );
	return (
		<>
			<p className="post-publish-panel__postpublish-subheader">
				<strong>{ __( 'What’s next?' ) }</strong>
			</p>
			<p>
				{ sprintf(
					// translators: %1$s: post title, %2$s: template type
					'Do you want to activate %1$s as the %2$s template?',
					postTitle,
					post.slug
				) }
			</p>

			<div className="post-publish-panel__postpublish-buttons">
				<Button
					variant="primary"
					onClick={ async () => {
						const currentSite = await registry
							.select( coreStore )
							.getEntityRecord( 'root', 'site' );
						await registry
							.dispatch( coreStore )
							.saveEntityRecord( 'root', 'site', {
								active_templates: {
									...currentSite.active_templates,
									[ post.slug ]: post.id,
								},
							} );
						await registry
							.dispatch( editorStore )
							.closePublishSidebar();
					} }
					__next40pxDefaultSize
					disabled={ isActivating }
					accessibleWhenDisabled={ false }
					ref={ focusOnMount ? focusRef : undefined }
				>
					{ isActivating ? __( 'Activating…' ) : __( 'Activate' ) }
				</Button>
			</div>
		</>
	);
}
