/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import {
	InspectorControls,
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
	getColorClassName,
	store as blockEditorStore,
	Warning,
} from '@wordpress/block-editor';
import {
	PanelBody,
	ToolbarButton,
	Spinner,
	Notice,
	ComboboxControl,
	Button,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useState, useEffect, useCallback } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useConvertToNavigationLinks } from './use-convert-to-navigation-links';
import {
	convertDescription,
	ConvertToLinksModal,
} from './convert-to-links-modal';

// We only show the edit option when page count is <= MAX_PAGE_COUNT
// Performance of Navigation Links is not good past this value.
const MAX_PAGE_COUNT = 100;
const NOOP = () => {};
function BlockContent( {
	blockProps,
	innerBlocksProps,
	hasResolvedPages,
	blockList,
	pages,
	parentPageID,
} ) {
	if ( ! hasResolvedPages ) {
		return (
			<div { ...blockProps }>
				<div className="wp-block-page-list__loading-indicator-container">
					<Spinner className="wp-block-page-list__loading-indicator" />
				</div>
			</div>
		);
	}

	if ( pages === null ) {
		return (
			<div { ...blockProps }>
				<Notice status={ 'warning' } isDismissible={ false }>
					{ __( 'Page List: Cannot retrieve Pages.' ) }
				</Notice>
			</div>
		);
	}

	if ( pages.length === 0 ) {
		return (
			<div { ...blockProps }>
				<Notice status={ 'info' } isDismissible={ false }>
					{ __( 'Page List: Cannot retrieve Pages.' ) }
				</Notice>
			</div>
		);
	}

	if ( blockList.length === 0 ) {
		const parentPageDetails = pages.find(
			( page ) => page.id === parentPageID
		);

		if ( parentPageDetails?.title?.rendered ) {
			return (
				<div { ...blockProps }>
					<Warning>
						{ sprintf(
							// translators: %s: Page title.
							__( 'Page List: "%s" page has no children.' ),
							parentPageDetails.title.rendered
						) }
					</Warning>
				</div>
			);
		}

		return (
			<div { ...blockProps }>
				<Notice status={ 'warning' } isDismissible={ false }>
					{ __( 'Page List: Cannot retrieve Pages.' ) }
				</Notice>
			</div>
		);
	}

	if ( pages.length > 0 ) {
		return <ul { ...innerBlocksProps }></ul>;
	}
}

export default function PageListEdit( {
	context,
	clientId,
	attributes,
	setAttributes,
} ) {
	const { parentPageID } = attributes;
	const [ isOpen, setOpen ] = useState( false );
	const openModal = useCallback( () => setOpen( true ), [] );
	const closeModal = () => setOpen( false );

	const { records: pages, hasResolved: hasResolvedPages } = useEntityRecords(
		'postType',
		'page',
		{
			per_page: MAX_PAGE_COUNT,
			_fields: [ 'id', 'link', 'menu_order', 'parent', 'title', 'type' ],
			// TODO: When https://core.trac.wordpress.org/ticket/39037 REST API support for multiple orderby
			// values is resolved, update 'orderby' to [ 'menu_order', 'post_title' ] to provide a consistent
			// sort.
			orderby: 'menu_order',
			order: 'asc',
		}
	);

	const allowConvertToLinks =
		'showSubmenuIcon' in context &&
		pages?.length > 0 &&
		pages?.length <= MAX_PAGE_COUNT;

	const pagesByParentId = useMemo( () => {
		if ( pages === null ) {
			return new Map();
		}

		// TODO: Once the REST API supports passing multiple values to
		// 'orderby', this can be removed.
		// https://core.trac.wordpress.org/ticket/39037
		const sortedPages = pages.sort( ( a, b ) => {
			if ( a.menu_order === b.menu_order ) {
				return a.title.rendered.localeCompare( b.title.rendered );
			}
			return a.menu_order - b.menu_order;
		} );

		return sortedPages.reduce( ( accumulator, page ) => {
			const { parent } = page;
			if ( accumulator.has( parent ) ) {
				accumulator.get( parent ).push( page );
			} else {
				accumulator.set( parent, [ page ] );
			}
			return accumulator;
		}, new Map() );
	}, [ pages ] );

	const blockProps = useBlockProps( {
		className: classnames( 'wp-block-page-list', {
			'has-text-color': !! context.textColor,
			[ getColorClassName( 'color', context.textColor ) ]:
				!! context.textColor,
			'has-background': !! context.backgroundColor,
			[ getColorClassName(
				'background-color',
				context.backgroundColor
			) ]: !! context.backgroundColor,
		} ),
		style: { ...context.style?.color },
	} );

	const pagesTree = useMemo(
		function makePagesTree( parentId = 0, level = 0 ) {
			const childPages = pagesByParentId.get( parentId );

			if ( ! childPages?.length ) {
				return [];
			}

			return childPages.reduce( ( tree, page ) => {
				const hasChildren = pagesByParentId.has( page.id );
				const item = {
					value: page.id,
					label: '— '.repeat( level ) + page.title.rendered,
					rawName: page.title.rendered,
				};
				tree.push( item );
				if ( hasChildren ) {
					tree.push( ...makePagesTree( page.id, level + 1 ) );
				}
				return tree;
			}, [] );
		},
		[ pagesByParentId ]
	);

	const blockList = useMemo(
		function getBlockList( parentId = parentPageID ) {
			const childPages = pagesByParentId.get( parentId );

			if ( ! childPages?.length ) {
				return [];
			}

			return childPages.reduce( ( template, page ) => {
				const hasChildren = pagesByParentId.has( page.id );
				const pageProps = {
					id: page.id,
					label:
						// translators: displayed when a page has an empty title.
						page.title?.rendered?.trim() !== ''
							? page.title?.rendered
							: __( '(no title)' ),
					title: page.title?.rendered,
					link: page.url,
					hasChildren,
				};
				let item = null;
				const children = getBlockList( page.id );
				item = createBlock(
					'core/page-list-item',
					pageProps,
					children
				);
				template.push( item );

				return template;
			}, [] );
		},
		[ pagesByParentId, parentPageID ]
	);

	const {
		isNested,
		hasSelectedChild,
		parentClientId,
		hasDraggedChild,
		isChildOfNavigation,
	} = useSelect(
		( select ) => {
			const {
				getBlockParentsByBlockName,
				hasSelectedInnerBlock,
				hasDraggedInnerBlock,
			} = select( blockEditorStore );
			const blockParents = getBlockParentsByBlockName(
				clientId,
				'core/navigation-submenu',
				true
			);
			const navigationBlockParents = getBlockParentsByBlockName(
				clientId,
				'core/navigation',
				true
			);
			return {
				isNested: blockParents.length > 0,
				isChildOfNavigation: navigationBlockParents.length > 0,
				hasSelectedChild: hasSelectedInnerBlock( clientId, true ),
				hasDraggedChild: hasDraggedInnerBlock( clientId, true ),
				parentClientId: navigationBlockParents[ 0 ],
			};
		},
		[ clientId ]
	);

	const convertToNavigationLinks = useConvertToNavigationLinks( {
		clientId,
		pages,
		parentClientId,
		parentPageID,
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		renderAppender: false,
		__unstableDisableDropZone: true,
		templateLock: isChildOfNavigation ? false : 'all',
		onInput: NOOP,
		onChange: NOOP,
		value: blockList,
	} );

	const { selectBlock } = useDispatch( blockEditorStore );

	useEffect( () => {
		if ( hasSelectedChild || hasDraggedChild ) {
			openModal();
			selectBlock( parentClientId );
		}
	}, [
		hasSelectedChild,
		hasDraggedChild,
		parentClientId,
		selectBlock,
		openModal,
	] );

	useEffect( () => {
		setAttributes( { isNested } );
	}, [ isNested, setAttributes ] );

	return (
		<>
			<InspectorControls>
				{ pagesTree.length > 0 && (
					<PanelBody>
						<ComboboxControl
							__next40pxDefaultSize
							className="editor-page-attributes__parent"
							label={ __( 'Parent' ) }
							value={ parentPageID }
							options={ pagesTree }
							onChange={ ( value ) =>
								setAttributes( { parentPageID: value ?? 0 } )
							}
							help={ __(
								'Choose a page to show only its subpages.'
							) }
						/>
					</PanelBody>
				) }
				{ allowConvertToLinks && (
					<PanelBody title={ __( 'Edit this menu' ) }>
						<p>{ convertDescription }</p>
						<Button
							variant="primary"
							disabled={ ! hasResolvedPages }
							onClick={ convertToNavigationLinks }
						>
							{ __( 'Edit' ) }
						</Button>
					</PanelBody>
				) }
			</InspectorControls>
			{ allowConvertToLinks && (
				<>
					<BlockControls group="other">
						<ToolbarButton
							title={ __( 'Edit' ) }
							onClick={ openModal }
						>
							{ __( 'Edit' ) }
						</ToolbarButton>
					</BlockControls>
					{ isOpen && (
						<ConvertToLinksModal
							onClick={ convertToNavigationLinks }
							onClose={ closeModal }
							disabled={ ! hasResolvedPages }
						/>
					) }
				</>
			) }
			<BlockContent
				blockProps={ blockProps }
				innerBlocksProps={ innerBlocksProps }
				hasResolvedPages={ hasResolvedPages }
				blockList={ blockList }
				pages={ pages }
				parentPageID={ parentPageID }
			/>
		</>
	);
}
