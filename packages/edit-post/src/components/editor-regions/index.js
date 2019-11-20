/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { navigateRegions } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function EditorRegions( { footer, header, sidebar, content, publish, className } ) {
	return (
		<div className={ classnames( className, 'edit-post-editor-regions' ) }>
			{ !! header && (
				<div
					className="edit-post-editor-regions__header"
					role="region"
					/* translators: accessibility text for the top bar landmark region. */
					aria-label={ __( 'Editor top bar' ) }
					tabIndex="-1"
				>
					{ header }
				</div>
			) }
			<div className="edit-post-editor-regions__body">
				<div
					className="edit-post-editor-regions__content"
					role="region"
					/* translators: accessibility text for the content landmark region. */
					aria-label={ __( 'Editor content' ) }
					tabIndex="-1"
				>
					{ content }
				</div>
				{ !! publish && (
					<div
						className="edit-post-editor-regions__publish"
						role="region"
						/* translators: accessibility text for the publish landmark region. */
						aria-label={ __( 'Editor publish' ) }
						tabIndex="-1"
					>
						{ publish }
					</div>
				) }
				{ !! sidebar && (
					<div
						className="edit-post-editor-regions__sidebar"
						role="region"
						aria-label={ 'Editor settings' }
						tabIndex="-1"
					>
						{ sidebar }
					</div>
				) }
			</div>
			{ !! footer && (
				<div
					className="edit-post-editor-regions__footer"
					role="region"
					aria-label={ 'Editor footer' }
					tabIndex="-1"
				>
					{ footer }
				</div>
			) }
		</div>
	);
}

export default navigateRegions( EditorRegions );
