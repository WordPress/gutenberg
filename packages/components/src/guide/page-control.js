/**
 * External dependencies
 */
import { times } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../button';
import { PageControlIcon } from './icons';

export default function PageControl( { currentPage, numberOfPages, setCurrentPage } ) {
	return (
		<ul className="components-guide__page-control" aria-label={ __( 'Guide controls' ) }>
			{ times( numberOfPages, ( page ) => (
				<li
					key={ page }
					// Set aria-current="step" on the active page, see https://www.w3.org/TR/wai-aria-1.1/#aria-current
					aria-current={ page === currentPage ? 'step' : undefined }
				>
					<Button
						key={ page }
						icon={ <PageControlIcon isSelected={ page === currentPage } /> }
						/* translators: %1$d: current page number %2$d: total number of pages */
						aria-label={ sprintf( __( 'Page %1$d of %2$d' ), page + 1, numberOfPages ) }
						onClick={ () => setCurrentPage( page ) }
					/>
				</li>
			) ) }
		</ul>
	);
}
