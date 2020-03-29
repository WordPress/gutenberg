/**
 * External dependencies
 */
const { isEqual } = require( 'lodash' );

/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ListItem from './list-item';
import {
	convertBlocksToTableOfContents,
	linearToNestedHeadingList,
} from './utils';

export default function TableOfContentsEdit( {
	attributes,
	className,
	setAttributes,
} ) {
	const { headings = [] } = attributes;

	const headingBlocks = useSelect( ( select ) => {
		return select( blockEditorStore )
			.getBlocks()
			.filter( ( block ) => block.name === 'core/heading' );
	}, [] );

	useEffect( () => {
		const latestHeadings = convertBlocksToTableOfContents( headingBlocks );

		if ( ! isEqual( headings, latestHeadings ) ) {
			setAttributes( { headings: latestHeadings } );
		}
	}, [ headingBlocks ] );

	if ( headings.length === 0 ) {
		return (
			<p>
				{ __(
					'Start adding Heading blocks to create a table of contents here.'
				) }
			</p>
		);
	}

	return (
		<div className={ className }>
			<ListItem>{ linearToNestedHeadingList( headings ) }</ListItem>
		</div>
	);
}
