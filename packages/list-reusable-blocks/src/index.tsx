/**
 * WordPress dependencies
 */
import { createRoot, StrictMode } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ImportDropdown from './components/import-dropdown';
import exportReusableBlock from './utils/export';

// Setup Export Links.
document.body.addEventListener( 'click', ( event: MouseEvent ) => {
	const target = event.target as HTMLElement;

	if ( ! target.classList.contains( 'wp-list-reusable-blocks__export' ) ) {
		return;
	}

	event.preventDefault();

	const blockId = target.dataset.id;
	if ( blockId ) {
		exportReusableBlock( Number( blockId ) );
	}
} );

// Setup Import Form.
document.addEventListener( 'DOMContentLoaded', () => {
	const button = document.querySelector( '.page-title-action' );
	if ( ! button ) {
		return;
	}

	const showNotice = () => {
		const notice = document.createElement( 'div' );
		notice.className = 'notice notice-success is-dismissible';
		notice.innerHTML = `<p>${ __( 'Pattern imported successfully!' ) }</p>`;

		const headerEnd = document.querySelector( '.wp-header-end' );
		if ( ! headerEnd || ! headerEnd.parentNode ) {
			return;
		}
		headerEnd.parentNode.insertBefore( notice, headerEnd );
	};

	const container = document.createElement( 'div' );
	container.className = 'list-reusable-blocks__container';

	if ( ! button.parentNode ) {
		return;
	}

	button.parentNode.insertBefore( container, button );
	createRoot( container ).render(
		<StrictMode>
			<ImportDropdown onUpload={ showNotice } />
		</StrictMode>
	);
} );
