/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { QueryPaginationNumbersMidSizeControl } from './query-pagination-numbers-mid-size-control';

const createPaginationItem = ( content, Tag = 'a', extraClass = '' ) => (
	<Tag key={ content } className={ `page-numbers ${ extraClass }` }>
		{ content }
	</Tag>
);

const previewPaginationNumbers = ( midSize ) => {
	const paginationItems = [];

	// First set of pagination items.
	for ( let i = 1; i <= midSize; i++ ) {
		paginationItems.push( createPaginationItem( i ) );
	}

	// Current pagination item.
	paginationItems.push(
		createPaginationItem( midSize + 1, 'span', 'current' )
	);

	// Second set of pagination items.
	for ( let i = 1; i <= midSize; i++ ) {
		paginationItems.push( createPaginationItem( midSize + 1 + i ) );
	}

	// Dots.
	paginationItems.push( createPaginationItem( '...', 'span', 'dots' ) );

	// Last pagination item.
	paginationItems.push( createPaginationItem( midSize * 2 + 2 ) );

	return <>{ paginationItems }</>;
};

export default function QueryPaginationNumbersEdit( {
	attributes,
	setAttributes,
} ) {
	const { midSize } = attributes;
	const paginationNumbers = previewPaginationNumbers(
		parseInt( midSize, 10 )
	);
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<QueryPaginationNumbersMidSizeControl
						value={ midSize }
						onChange={ ( value ) => {
							setAttributes( {
								midSize: parseInt( value, 10 ),
							} );
						} }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>{ paginationNumbers }</div>
		</>
	);
}
