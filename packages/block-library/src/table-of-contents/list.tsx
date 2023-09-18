/**
 * External dependencies
 */
import type { MouseEvent } from 'react';

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
	onClick,
}: {
	nestedHeadingList: NestedHeadingData[];
	disableLinkActivation?: boolean;
	onClick?: ( event: MouseEvent< HTMLAnchorElement > ) => void;
} ): WPElement {
	// Handle onClick callback.
	const handleOnClick = ( event: MouseEvent< HTMLAnchorElement > ) => {
		if ( 'function' === typeof onClick ) {
			onClick( event );
		}
	};

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
							disableLinkActivation ? handleOnClick : undefined
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
