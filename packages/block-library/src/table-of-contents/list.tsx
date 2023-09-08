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
	disableLinkActivation,
}: {
	nestedHeadingList: NestedHeadingData[];
	disableLinkActivation?: boolean;
} ): WPElement {
	return (
		<>
			{ nestedHeadingList.map( ( node, index ) => {
				const { content, link } = node.heading;

				const entry = link ? (
					<a
						className={ ENTRY_CLASS_NAME }
						href={ link }
						aria-disabled={ disableLinkActivation || undefined }
						onClick={
							disableLinkActivation
								? ( event ) => event?.preventDefault()
								: undefined
						}
						onContextMenu={
							disableLinkActivation
								? ( event ) => event?.preventDefault()
								: undefined
						}
					>
						{ content }
					</a>
				) : (
					<span className={ ENTRY_CLASS_NAME }>{ content }</span>
				);

				return (
					<li key={ index }>
						{ entry }
						{ node.children ? (
							<ol>
								<TableOfContentsList
									nestedHeadingList={ node.children }
								/>
							</ol>
						) : null }
					</li>
				);
			} ) }
		</>
	);
}
