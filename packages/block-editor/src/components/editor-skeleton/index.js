/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { navigateRegions } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function EditorSkeleton( {
	footer,
	header,
	sidebar,
	content,
	publish,
	className,
} ) {
	return (
		<div
			className={ classnames(
				className,
				'block-editor-editor-skeleton'
			) }
		>
			{ !! header && (
				<div
					className="block-editor-editor-skeleton__header"
					role="region"
					/* translators: accessibility text for the top bar landmark region. */
					aria-label={ __( 'Editor top bar' ) }
					tabIndex="-1"
				>
					{ header }
				</div>
			) }
			<div className="block-editor-editor-skeleton__body">
				<div
					className="block-editor-editor-skeleton__content"
					role="region"
					/* translators: accessibility text for the content landmark region. */
					aria-label={ __( 'Editor content' ) }
					tabIndex="-1"
				>
					{ content }
				</div>
				{ !! sidebar && (
					<div
						className="block-editor-editor-skeleton__sidebar"
						role="region"
						/* translators: accessibility text for the settings landmark region. */
						aria-label={ __( 'Editor settings' ) }
						tabIndex="-1"
					>
						{ sidebar }
					</div>
				) }
				{ !! publish && (
					<div
						className="block-editor-editor-skeleton__publish"
						role="region"
						/* translators: accessibility text for the publish landmark region. */
						aria-label={ __( 'Editor publish' ) }
						tabIndex="-1"
					>
						{ publish }
					</div>
				) }
			</div>
			{ !! footer && (
				<div
					className="block-editor-editor-skeleton__footer"
					role="region"
					/* translators: accessibility text for the footer landmark region. */
					aria-label={ __( 'Editor footer' ) }
					tabIndex="-1"
				>
					{ footer }
				</div>
			) }
		</div>
	);
}

export default navigateRegions( EditorSkeleton );
