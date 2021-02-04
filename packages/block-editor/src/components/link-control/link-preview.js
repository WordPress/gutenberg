/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { filterURLForDisplay, safeDecodeURI } from '@wordpress/url';

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
			<span className="block-editor-link-control__link-current-url">
				{ displayURL }
			</span>

			<Button
				isPrimary
				label={ __( 'Edit link URL' ) }
				onClick={ () => onEditClick() }
				className="block-editor-link-control__link-edit"
			>
				{ __( 'Edit' ) }
			</Button>

			<Button
				isTertiary
				target="_blank"
				label={ __( 'Visit URL' ) }
				showToolTip={ true }
				className="block-editor-link-control__link-visit"
				href={ value.url }
			>
				{ __( 'Visit' ) }
			</Button>

			<ViewerSlot fillProps={ value } />
		</div>
	);
}
