/**
 * WordPress dependencies
 */
import type { WPElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { NestedHeadingData } from './utils';

const ENTRY_CLASS_NAME = 'wp-block-table-of-contents__entry';

export default function TableOfContentsList( {
	nestedHeadingList,
}: {
	nestedHeadingList: NestedHeadingData[];
} ): WPElement {
	return (
		<>
			{ nestedHeadingList.map( ( node, index ) => {
				const { content, link } = node.heading;

				const entry = link ? (
					<a className={ ENTRY_CLASS_NAME } href={ link }>
						{ content }
					</a>
				) : (
					<span className={ ENTRY_CLASS_NAME }>{ content }</span>
				);

				return (
					<li key={ index }>
						{ entry }
						{ node.children ? (
							<ul>
								<TableOfContentsList
									nestedHeadingList={ node.children }
								/>
							</ul>
						) : null }
					</li>
				);
			} ) }
		</>
	);
}
