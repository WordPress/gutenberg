/**
 * External dependencies
 */
import type { MouseEvent, ReactElement } from 'react';

/**
 * Internal dependencies
 */
import type { NestedHeadingData } from './utils';

const ENTRY_CLASS_NAME = 'wp-block-table-of-contents__entry';

export default function TableOfContentsList( {
	nestedHeadingList,
	disableLinkActivation,
	onClick,
}: {
	nestedHeadingList: NestedHeadingData[];
	disableLinkActivation?: boolean;
	onClick?: ( event: MouseEvent< HTMLAnchorElement > ) => void;
} ): ReactElement {
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
							disableLinkActivation &&
							'function' === typeof onClick
								? onClick
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
									disableLinkActivation={
										disableLinkActivation
									}
									onClick={
										disableLinkActivation &&
										'function' === typeof onClick
											? onClick
											: undefined
									}
								/>
							</ol>
						) : null }
					</li>
				);
			} ) }
		</>
	);
}
