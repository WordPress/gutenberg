/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function TableCellEdit( { attributes, setAttributes } ) {
	const { content, tag: CellTag, section, align } = attributes;

	let placeholder;
	if ( section === 'head' ) {
		placeholder = __( 'Header label' );
	} else if ( section === 'foot' ) {
		placeholder = __( 'Footer label' );
	}

	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ align }` ]: align,
		} ),
	} );

	return (
		<CellTag { ...blockProps }>
			<RichText
				tagName="div"
				className="wp-block-table-v2-cell__content"
				value={ content }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				placeholder={ placeholder }
				aria-label={
					// eslint-disable-next-line no-nested-ternary
					section === 'head'
						? __( 'Header cell text' )
						: section === 'foot'
						? __( 'Footer cell text' )
						: __( 'Body cell text' )
				}
			/>
		</CellTag>
	);
}
