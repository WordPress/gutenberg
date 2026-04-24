/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		content,
		tag: CellTag,
		scope,
		align,
		colSpan,
		rowSpan,
	} = attributes;

	const cellClasses = clsx( {
		[ `has-text-align-${ align }` ]: align,
	} );

	return (
		<CellTag
			{ ...useBlockProps.save( { className: cellClasses } ) }
			scope={ CellTag === 'th' ? scope : undefined }
			colSpan={ colSpan > 1 ? colSpan : undefined }
			rowSpan={ rowSpan > 1 ? rowSpan : undefined }
		>
			<RichText.Content value={ content } />
		</CellTag>
	);
}
