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
import IconButton from '../icon-button';
import List from '../list';
import { PageControlIcon } from './icons';

export default function PageControl( { currentPage, numberOfPages, setCurrentPage } ) {
	return (
		<List
			className="components-guide__page-control"
			accessibilityLabel={ __( 'Guide controls' ) }
		>
			{ times( numberOfPages, ( page ) => (
				<li key={ page }>
					<IconButton
						key={ page }
						icon={ <PageControlIcon isSelected={ page === currentPage } /> }
						/* translators: %1$d: current page number %2$d: total number of pages */
						aria-label={ sprintf( __( 'Page %1$d of %2$d' ), page + 1, numberOfPages ) }
						onClick={ () => setCurrentPage( page ) }
					/>
				</li>
			) ) }
		</List>
	);
}
