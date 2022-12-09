/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useLinkControlContext } from './';

export function LinkControlLoading() {
	const { isLoading } = useLinkControlContext();

	if ( ! isLoading ) {
		return;
	}

	return (
		<div className="block-editor-link-control__loading">
			<Spinner /> { __( 'Creating' ) }…
		</div>
	);
}
