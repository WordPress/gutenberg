import { __ } from '@wordpress/i18n';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	RangeControl,
} from '@wordpress/components';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

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
	paginationItems.push( createPaginationItem( midSize * 2 + 3 ) );

	return <>{ paginationItems }</>;
};

/*
 * On the front end the letters are derived from the titles the query actually
 * matches, which the editor cannot know without running the query. Previewing
 * the full alphabet keeps this in line with the synthetic page numbers above,
 * and shows how much room the widest case takes up.
 */
const previewPaginationLetters = () => (
	<>
		{ createPaginationItem( __( 'All' ), 'span', 'current' ) }
		{ 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
			.split( '' )
			.map( ( letter ) => createPaginationItem( letter ) ) }
	</>
);

export default function QueryPaginationNumbersEdit( {
	attributes,
	setAttributes,
	context: { useAlphabeticalPagination },
} ) {
	const { midSize } = attributes;
	const paginationNumbers = useAlphabeticalPagination
		? previewPaginationLetters()
		: previewPaginationNumbers( parseInt( midSize, 10 ) );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const blockProps = useBlockProps();

	// "Number of links" has no meaning when the block renders letters.
	if ( useAlphabeticalPagination ) {
		return <div { ...blockProps }>{ paginationNumbers }</div>;
	}

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => setAttributes( { midSize: 2 } ) }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Number of links' ) }
						hasValue={ () => midSize !== 2 }
						onDeselect={ () => setAttributes( { midSize: 2 } ) }
						isShownByDefault
					>
						<RangeControl
							label={ __( 'Number of links' ) }
							help={ __(
								'Specify how many links can appear before and after the current page number. Links to the first, current and last page are always visible.'
							) }
							value={ midSize }
							onChange={ ( value ) => {
								setAttributes( {
									midSize: parseInt( value, 10 ),
								} );
							} }
							min={ 0 }
							max={ 5 }
							withInputField={ false }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<div { ...blockProps }>{ paginationNumbers }</div>
		</>
	);
}
