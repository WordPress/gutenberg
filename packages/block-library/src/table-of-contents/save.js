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
	attributes: {
		headings = [],
		ordered = true,
		hierarchicalNumbering = false,
	},
} ) {
	if ( headings.length === 0 ) {
		return null;
	}
	const blockProps = useBlockProps.save( {
		className: [
			! ordered ? 'is-unordered' : null,
			ordered && hierarchicalNumbering
				? 'is-hierarchical-numbering'
				: null,
		]
			.filter( Boolean )
			.join( ' ' ),
	} );
	return (
		<nav { ...blockProps }>
			{ ordered ? (
				<ol>
					<TableOfContentsList
						nestedHeadingList={ linearToNestedHeadingList(
							headings
						) }
						ordered={ ordered }
					/>
				</ol>
			) : (
				<ul>
					<TableOfContentsList
						nestedHeadingList={ linearToNestedHeadingList(
							headings
						) }
						ordered={ ordered }
					/>
				</ul>
			) }
		</nav>
	);
}
