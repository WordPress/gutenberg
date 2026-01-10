/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import TableOfContentsList from './list';
import { linearToNestedHeadingList } from './utils';

export default function save( {
	attributes: { headings = [], ordered = true },
} ) {
	if ( headings.length === 0 ) {
		return null;
	}
	const ListTag = ordered ? 'ol' : 'ul';
	return (
		<nav { ...useBlockProps.save() }>
			<ListTag>
				<TableOfContentsList
					nestedHeadingList={ linearToNestedHeadingList( headings ) }
					ordered={ ordered }
				/>
			</ListTag>
		</nav>
	);
}
