import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { content, tag: CellTag, scope, colSpan, rowSpan } = attributes;

	return (
		<CellTag
			{ ...useBlockProps.save() }
			scope={ CellTag === 'th' ? scope : undefined }
			colSpan={ colSpan > 1 ? colSpan : undefined }
			rowSpan={ rowSpan > 1 ? rowSpan : undefined }
		>
			<RichText.Content value={ content } />
		</CellTag>
	);
}
