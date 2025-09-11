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
	ordered = true,
}: {
	nestedHeadingList: NestedHeadingData[];
	disableLinkActivation?: boolean;
	onClick?: ( event: MouseEvent< HTMLAnchorElement > ) => void;
	ordered?: boolean;
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

				const childOnClick =
					disableLinkActivation && 'function' === typeof onClick
						? onClick
						: undefined;

				let childrenList: ReactElement | null = null;
				if ( node.children ) {
					if ( ordered ) {
						childrenList = (
							<ol>
								<TableOfContentsList
									nestedHeadingList={ node.children }
									disableLinkActivation={
										disableLinkActivation
									}
									onClick={ childOnClick }
									ordered={ ordered }
								/>
							</ol>
						);
					} else {
						childrenList = (
							<ul>
								<TableOfContentsList
									nestedHeadingList={ node.children }
									disableLinkActivation={
										disableLinkActivation
									}
									onClick={ childOnClick }
									ordered={ ordered }
								/>
							</ul>
						);
					}
				}

				return (
					<li key={ index }>
						{ entry }
						{ childrenList }
					</li>
				);
			} ) }
		</>
	);
}
