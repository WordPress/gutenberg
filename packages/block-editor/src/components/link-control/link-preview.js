/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, VisuallyHidden } from '@wordpress/components';
import { filterURLForDisplay, safeDecodeURI } from '@wordpress/url';
import { external } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ViewerSlot } from './viewer-slot';

export default function LinkPreview( { value, onEditClick } ) {
	const displayURL =
		( value && filterURLForDisplay( safeDecodeURI( value.url ), 16 ) ) ||
		'';

	return (
		<div
			aria-label={ __( 'Currently selected' ) }
			aria-selected="true"
			className={ classnames( 'block-editor-link-control__link', {
				'is-current': true,
			} ) }
		>
			<Button
				label={ __( 'Edit link URL' ) }
				onClick={ () => onEditClick() }
				className="block-editor-link-control__link-edit"
			>
				<VisuallyHidden>{ __( 'Edit link URL:' ) }</VisuallyHidden>
				{ displayURL }
			</Button>

			<div className="block-editor-link-control__link-divider"></div>

			<Button
				icon={ external }
				target="_blank"
				label={ __( 'Visit URL' ) }
				showToolTip={ true }
				className="block-editor-link-control__link-visit"
				href={ value.url }
			>
				<VisuallyHidden>{ __( 'Visit URL' ) }</VisuallyHidden>
			</Button>

			<ViewerSlot fillProps={ value } />
		</div>
	);
}
