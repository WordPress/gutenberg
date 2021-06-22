/**
 * External dependencies
 */
import { isEqual } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	BlockControls,
	BlockIcon,
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { createBlock, store as blocksStore } from '@wordpress/blocks';
import {
	PanelBody,
	Placeholder,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { renderToString, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TableOfContentsList from './list';
import { getHeadingsFromContent, linearToNestedHeadingList } from './utils';

/**
 * Table of Contents block edit component.
 *
 * @param {Object}                       props            The props.
 * @param {Object}                       props.attributes The block attributes.
 * @param {boolean}                      props.attributes.onlyIncludeCurrentPage
 * Whether to only include headings from the current page (if the post is
 * paginated).
 * @param {string}                       props.clientId
 * @param {(attributes: Object) => void} props.setAttributes
 *
 * @return {WPComponent} The component.
 */
export default function TableOfContentsEdit( {
	attributes: { onlyIncludeCurrentPage },
	clientId,
	setAttributes,
} ) {
	const blockProps = useBlockProps();

	// Local state; not saved to block attributes. The saved block is dynamic and uses PHP to generate its content.
	const [ headings, setHeadings ] = useState( [] );
	const [ headingTree, setHeadingTree ] = useState( [] );

	const { listBlockExists, postContent } = useSelect(
		( select ) => ( {
			listBlockExists: !! select( blocksStore ).getBlockType(
				'core/list'
			),
			// FIXME: @wordpress/block-library should not depend on @wordpress/editor.
			// Blocks can be loaded into a *non-post* block editor.
			// eslint-disable-next-line @wordpress/data-no-store-string-literals
			postContent: select( 'core/editor' ).getEditedPostContent(),
		} ),
		[]
	);

	// The page this block would be part of on the front-end. For performance
	// reasons, this is only calculated when onlyIncludeCurrentPage is true.
	const pageIndex = useSelect(
		( select ) => {
			if ( ! onlyIncludeCurrentPage ) {
				return null;
			}

			const {
				getBlockAttributes,
				getBlockIndex,
				getBlockName,
				getBlockOrder,
			} = select( blockEditorStore );

			const blockIndex = getBlockIndex( clientId );
			const blockOrder = getBlockOrder();

			// Calculate which page the block will appear in on the front-end by
			// counting how many <!--nextpage--> tags precede it.
			// Unfortunately, this implementation only accounts for Page Break and
			// Classic blocks, so if there are any <!--nextpage--> tags in any
			// other block, they won't be counted. This will result in the table
			// of contents showing headings from the wrong page if
			// onlyIncludeCurrentPage === true. Thankfully, this issue only
			// affects the editor implementation.
			let page = 1;
			for ( let i = 0; i < blockIndex; i++ ) {
				const blockName = getBlockName( blockOrder[ i ] );
				if ( blockName === 'core/nextpage' ) {
					page++;
				} else if ( blockName === 'core/freeform' ) {
					// Count the page breaks inside the Classic block.
					const pageBreaks = getBlockAttributes(
						blockOrder[ i ]
					).content?.match( /<!--nextpage-->/g );

					if ( pageBreaks !== null && pageBreaks !== undefined ) {
						page += pageBreaks.length;
					}
				}
			}

			return page;
		},
		[ clientId, onlyIncludeCurrentPage ]
	);

	useEffect( () => {
		let latestHeadings;

		if ( onlyIncludeCurrentPage ) {
			const pagesOfContent = postContent.split( '<!--nextpage-->' );

			latestHeadings = getHeadingsFromContent(
				pagesOfContent[ pageIndex - 1 ]
			);
		} else {
			latestHeadings = getHeadingsFromContent( postContent );
		}

		if ( ! isEqual( headings, latestHeadings ) ) {
			setHeadings( latestHeadings );
			setHeadingTree( linearToNestedHeadingList( latestHeadings ) );
		}
	}, [ pageIndex, postContent, onlyIncludeCurrentPage ] );

	const { replaceBlocks } = useDispatch( blockEditorStore );

	const toolbarControls = listBlockExists && (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					onClick={ () =>
						replaceBlocks(
							clientId,
							createBlock( 'core/list', {
								values: renderToString(
									<TableOfContentsList
										nestedHeadingList={ headingTree }
									/>
								),
							} )
						)
					}
				>
					{ __( 'Convert to static list' ) }
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Table of Contents settings' ) }>
				<ToggleControl
					label={ __( 'Only include current page' ) }
					checked={ onlyIncludeCurrentPage }
					onChange={ ( value ) =>
						setAttributes( { onlyIncludeCurrentPage: value } )
					}
					help={
						onlyIncludeCurrentPage
							? __(
									'Only including headings from the current page (if the post is paginated).'
							  )
							: __(
									'Toggle to only include headings from the current page (if the post is paginated).'
							  )
					}
				/>
			</PanelBody>
		</InspectorControls>
	);

	// If there are no headings or the only heading is empty.
	// Note that the toolbar controls are intentionally omitted since the
	// "Convert to static list" option is useless to the placeholder state.
	if ( headings.length === 0 ) {
		return (
			<>
				<div { ...blockProps }>
					<Placeholder
						icon={ <BlockIcon icon="list-view" /> }
						label="Table of Contents"
						instructions={ __(
							'Start adding Heading blocks to create a table of contents. Headings with HTML anchors will be linked here.'
						) }
					/>
				</div>
				{ inspectorControls }
			</>
		);
	}

	return (
		<>
			<nav { ...blockProps }>
				<ul>
					<TableOfContentsList nestedHeadingList={ headingTree } />
				</ul>
			</nav>
			{ toolbarControls }
			{ inspectorControls }
		</>
	);
}
