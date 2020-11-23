/**
 * WordPress dependencies
 */
import { Button, ButtonGroup } from '@wordpress/components';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useQueryContext } from '../query';

export default function QueryPaginationEdit( {
	context: {
		query: { pages = 1 },
		queryContext,
	},
} ) {
	const [ { page }, setQueryContext ] = useQueryContext() || queryContext;

	let previous;
	if ( page > 1 ) {
		previous = (
			<Button
				isPrimary
				icon={ chevronLeft }
				onClick={ () => setQueryContext( { page: page - 1 } ) }
			>
				{ __( 'Previous' ) }
			</Button>
		);
	}
	let next;
	if ( page < pages ) {
		next = (
			<Button
				isPrimary
				icon={ chevronRight }
				onClick={ () => setQueryContext( { page: page + 1 } ) }
			>
				{ __( 'Next' ) }
			</Button>
		);
	}
	return (
		<div { ...useBlockProps() }>
			{ previous || next ? (
				<ButtonGroup>
					{ previous }
					{ next }
				</ButtonGroup>
			) : (
				__( 'No pages to paginate.' )
			) }
		</div>
	);
}
