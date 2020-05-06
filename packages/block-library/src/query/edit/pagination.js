/**
 * WordPress dependencies
 */
import { ButtonGroup, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';

export default function Pagination( { pages, page, setPage } ) {
	return (
		<ButtonGroup>
			{ page > 1 && (
				<Button
					isPrimary
					icon={ chevronLeft }
					onClick={ () =>
						setPage( ( currentPage ) => currentPage - 1 )
					}
				>
					{ __( 'Previous' ) }
				</Button>
			) }
			{ page < pages && (
				<Button
					isPrimary
					icon={ chevronRight }
					onClick={ () =>
						setPage( ( currentPage ) => currentPage + 1 )
					}
				>
					{ __( 'Next' ) }
				</Button>
			) }
		</ButtonGroup>
	);
}
