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
import { renderToString, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import icon from './icon';
import TableOfContentsList from './list';
import { linearToNestedHeadingList } from './utils';

/** @typedef {import('./utils').HeadingData} HeadingData */

/**
 * Table of Contents block edit component.
 *
 * @param {Object}                       props                                   The props.
 * @param {Object}                       props.attributes                        The block attributes.
 * @param {HeadingData[]}                props.attributes.headings               A list of data for each heading in the post.
 * @param {boolean}                      props.attributes.onlyIncludeCurrentPage Whether to only include headings from the current page (if the post is paginated).
 * @param {string}                       props.clientId
 * @param {(attributes: Object) => void} props.setAttributes
 *
 * @return {WPComponent} The component.
 */
export default function TableOfContentsEdit( {
	attributes: { headings = [], onlyIncludeCurrentPage },
	clientId,
	setAttributes,
} ) {
	const blockProps = useBlockProps();

	const listBlockExists = useSelect(
		( select ) => !! select( blocksStore ).getBlockType( 'core/list' ),
		[]
	);

	const {
		__unstableMarkNextChangeAsNotPersistent,
		replaceBlocks,
	} = useDispatch( blockEditorStore );

	const latestHeadings = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getBlockIndex,
				getBlockName,
				getBlockOrder,
				getClientIdsOfDescendants,
				getGlobalBlockCount,
			} = select( blockEditorStore );

			// Disable reason: blocks can be loaded into a *non-post* block editor, so to avoid declaring @wordpress/editor as a dependency, we must access its store by string. When the store is not available, editorSelectors will be null, and the block's saved markup will lack permalinks.
			// eslint-disable-next-line @wordpress/data-no-store-string-literals
			const editorSelectors = select( 'core/editor' );

			const isPaginated = getGlobalBlockCount( 'core/nextpage' ) !== 0;

			const blockIndex = getBlockIndex( clientId );

			// Get the top-level block client ids, and add them and the client ids of their children to an ordered list. We don't use getClientIdsWithDescendants because it returns ids in the wrong order.
			const allBlockClientIds = [];
			for ( const blockClientId of getBlockOrder() ) {
				allBlockClientIds.push(
					blockClientId,
					...getClientIdsOfDescendants( [ blockClientId ] )
				);
			}

			const _latestHeadings = [];

			// Calculate the page (of a paginated post) the Table of Contents block is part of.
			let tocPage = 1;
			for ( const [ i, blockClientId ] of allBlockClientIds.entries() ) {
				if ( i > blockIndex ) {
					break;
				}
				if ( getBlockName( blockClientId ) === 'core/nextpage' ) {
					tocPage++;
				}
			}

			/** The page (of a paginated post) a heading will be part of. */
			let headingPage = 1;

			/** If the core/editor store is available, we can add permalinks to the generated table of contents. This variable will be a link to current post including pagination query if necessary. */
			const permalink = editorSelectors?.getPermalink() ?? null;

			let headingPageLink = null;

			// If the core/editor store is available, we can add permalinks to the generated table of contents.
			if ( typeof permalink === 'string' ) {
				headingPageLink = isPaginated
					? addQueryArgs( permalink, { page: headingPage } )
					: permalink;
			}

			for ( const blockClientId of allBlockClientIds ) {
				const blockName = getBlockName( blockClientId );
				if ( blockName === 'core/nextpage' ) {
					headingPage++;

					// If we're only including headings from the current page (of
					// a paginated post), then exit the loop if we've reached the
					// pages after the one with the Table of Contents block.
					if ( onlyIncludeCurrentPage && headingPage > tocPage ) {
						break;
					}

					if ( typeof permalink === 'string' ) {
						headingPageLink = addQueryArgs(
							removeQueryArgs( permalink, [ 'page' ] ),
							{ page: headingPage }
						);
					}
				}
				// If we're including all headings or we've reached headings on
				// the same page as the Table of Contents block, add them to the
				// list.
				else if (
					! onlyIncludeCurrentPage ||
					headingPage === tocPage
				) {
					if ( blockName === 'core/heading' ) {
						const headingAttributes = getBlockAttributes(
							blockClientId
						);

						const canBeLinked =
							typeof headingPageLink === 'string' &&
							typeof headingAttributes.anchor === 'string' &&
							headingAttributes.anchor !== '';

						_latestHeadings.push( {
							content: headingAttributes.content,
							level: headingAttributes.level,
							link: canBeLinked
								? `${ headingPageLink }#${ headingAttributes.anchor }`
								: null,
						} );
					}
				}
			}

			return _latestHeadings;
		},
		[ clientId, onlyIncludeCurrentPage ]
	);

	useEffect( () => {
		if ( ! isEqual( headings, latestHeadings ) ) {
			// This is required to keep undo working and not create 2 undo steps for each heading change.
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { headings: latestHeadings } );
		}
	} );

	const headingTree = linearToNestedHeadingList( headings );

	const toolbarControls = listBlockExists && (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					onClick={ () =>
						replaceBlocks(
							clientId,
							createBlock( 'core/list', {
								ordered: true,
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
						icon={ <BlockIcon icon={ icon } /> }
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
				<ol>
					<TableOfContentsList nestedHeadingList={ headingTree } />
				</ol>
			</nav>
			{ toolbarControls }
			{ inspectorControls }
		</>
	);
}
