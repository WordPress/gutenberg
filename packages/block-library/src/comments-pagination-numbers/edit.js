/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

const PaginationItem = ( { content, tag: Tag = 'a', extraClass = '' } ) => (
	<Tag className={ `page-numbers ${ extraClass }` }>{ content }</Tag>
);

export default function CommentsPaginationNumbersEdit() {
	return (
		<div { ...useBlockProps() }>
			<PaginationItem content="1" />
			<PaginationItem content="2" />
			<PaginationItem content="3" tag="span" extraClass="current" />
			<PaginationItem content="4" />
			<PaginationItem content="5" />
			<PaginationItem content="..." tag="span" extraClass="dots" />
			<PaginationItem content="8" />
		</div>
	);
}
