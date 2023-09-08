/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TableOfContentsList from './list';
import { linearToNestedHeadingList } from './utils';

export default function save( { attributes: { headings = [] } } ) {
	if ( headings.length === 0 ) {
		return null;
	}

	const blockProps = useBlockProps.save( {
		'aria-label': __( 'Table of Contents' ),
	} );

	return (
		<nav { ...blockProps }>
			<ol>
				<TableOfContentsList
					nestedHeadingList={ linearToNestedHeadingList( headings ) }
				/>
			</ol>
		</nav>
	);
}
