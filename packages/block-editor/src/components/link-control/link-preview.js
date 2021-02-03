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
import { edit } from '@wordpress/icons';

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
				target="_blank"
				label={ __( 'Visit URL' ) }
				showToolTip={ true }
				className="block-editor-link-control__link-url"
				href={ value.url }
			>
				{ displayURL }
			</Button>

			<div className="block-editor-link-control__link-divider"></div>

			<Button
				icon={ edit }
				label={ __( 'Edit' ) }
				onClick={ () => onEditClick() }
				className="block-editor-link-control__link-action"
			>
				<VisuallyHidden>{ __( 'Edit' ) }</VisuallyHidden>
			</Button>

			<ViewerSlot fillProps={ value } />
		</div>
	);
}
