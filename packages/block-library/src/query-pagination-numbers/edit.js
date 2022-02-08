/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

const createPaginationItem = ( content, Tag = 'a', extraClass = '' ) => (
	<Tag className={ `page-numbers ${ extraClass }` }>{ content }</Tag>
);

const previewPaginationNumbers = () => (
	<>
		{ createPaginationItem( 1 ) }
		{ createPaginationItem( 2 ) }
		{ createPaginationItem( 3, 'span', 'current' ) }
		{ createPaginationItem( 4 ) }
		{ createPaginationItem( 5 ) }
		{ createPaginationItem( '...', 'span', 'dots' ) }
		{ createPaginationItem( 8 ) }
	</>
);

export default function QueryPaginationNumbersEdit() {
	const blockProps = useBlockProps();
	const paginationNumbers = previewPaginationNumbers();
	return <div { ...blockProps }> { paginationNumbers } </div>;
}
