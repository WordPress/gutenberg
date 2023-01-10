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
import { useMemo, useState, useEffect } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ConvertToLinksModal from './convert-to-links-modal';
import { convertToNavigationLinks } from './convert-to-navigation-links';
import { convertDescription } from './constants';

// We only show the edit option when page count is <= MAX_PAGE_COUNT
// Performance of Navigation Links is not good past this value.
const MAX_PAGE_COUNT = 100;
const NOOP = () => {};

export default function PageListEdit( {
	context,
	clientId,
	attributes,
	setAttributes,
} ) {
	const { parentPageID } = attributes;
	const [ pages ] = useGetPages();
	const { pagesByParentId, totalPages, hasResolvedPages } = usePageData();

	const isNavigationChild = 'showSubmenuIcon' in context;
	const allowConvertToLinks =
		isNavigationChild && totalPages <= MAX_PAGE_COUNT;

	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );

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

	const getBlockList = ( parentId = parentPageID ) => {
		const childPages = pagesByParentId.get( parentId );

		if ( ! childPages?.length ) {
			return [];
		}

		return childPages.reduce( ( template, page ) => {
			const hasChildren = pagesByParentId.has( page.id );
			const pageProps = {
				id: page.id,
				label: page.title?.rendered,
				title: page.title?.rendered,
				link: page.url,
				hasChildren,
			};
			let item = null;
			const children = getBlockList( page.id );
			item = createBlock( 'core/page-list-item', pageProps, children );
			template.push( item );

			return template;
		}, [] );
	};

	const makePagesTree = ( parentId = 0, level = 0 ) => {
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
	};

	const pagesTree = useMemo( makePagesTree, [ pagesByParentId ] );

	const blockList = useMemo( getBlockList, [
		pagesByParentId,
		parentPageID,
	] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'core/page-list-item' ],
		renderAppender: false,
		__unstableDisableDropZone: true,
		templateLock: 'all',
		onInput: NOOP,
		onChange: NOOP,
		value: blockList,
	} );

	const getBlockContent = () => {
		if ( ! hasResolvedPages ) {
			return (
				<div { ...blockProps }>
					<Spinner />
				</div>
			);
		}

		if ( totalPages === null ) {
			return (
				<div { ...blockProps }>
					<Notice status={ 'warning' } isDismissible={ false }>
						{ __( 'Page List: Cannot retrieve Pages.' ) }
					</Notice>
				</div>
			);
		}

		if ( totalPages === 0 ) {
			return (
				<div { ...blockProps }>
					<Notice status={ 'info' } isDismissible={ false }>
						{ __( 'Page List: Cannot retrieve Pages.' ) }
					</Notice>
				</div>
			);
		}

		if ( blockList.length === 0 ) {
			const parentPageDetails =
				pages && pages.find( ( page ) => page.id === parentPageID );
			return (
				<div { ...blockProps }>
					<Warning>
						{ sprintf(
							// translators: %s: Page title.
							__( '"%s" page has no children.' ),
							parentPageDetails.title.rendered
						) }
					</Warning>
				</div>
			);
		}

		if ( totalPages > 0 ) {
			return <ul { ...innerBlocksProps }></ul>;
		}
	};

	const { replaceBlock, selectBlock } = useDispatch( blockEditorStore );

	const { parentNavBlockClientId, isNested } = useSelect(
		( select ) => {
			const { getSelectedBlockClientId, getBlockParentsByBlockName } =
				select( blockEditorStore );

			const _selectedBlockClientId = getSelectedBlockClientId();

			return {
				parentNavBlockClientId: getBlockParentsByBlockName(
					_selectedBlockClientId,
					'core/navigation',
					true
				)[ 0 ],
				isNested:
					getBlockParentsByBlockName(
						clientId,
						'core/navigation-submenu',
						true
					).length > 0,
			};
		},
		[ clientId ]
	);

	useEffect( () => {
		setAttributes( { isNested } );
	}, [ isNested ] );

	return (
		<>
			<InspectorControls>
				{ isNavigationChild && pages?.length > 0 && (
					<PanelBody title={ __( 'Customize this menu' ) }>
						<p>{ convertDescription }</p>
						<Button
							variant="primary"
							disabled={ ! hasResolvedPages }
							onClick={ () => {
								const navigationLinks =
									convertToNavigationLinks( pages );

								// Replace the Page List block with the Navigation Links.
								replaceBlock( clientId, navigationLinks );

								// Select the Navigation block to reveal the changes.
								selectBlock( parentNavBlockClientId );
							} }
						>
							{ __( 'Customize' ) }
						</Button>
					</PanelBody>
				) }
				{ pagesTree.length > 0 && (
					<PanelBody>
						<ComboboxControl
							className="editor-page-attributes__parent"
							label={ __( 'Parent page' ) }
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
			</InspectorControls>
			{ allowConvertToLinks && totalPages > 0 && (
				<BlockControls group="other">
					<ToolbarButton title={ __( 'Edit' ) } onClick={ openModal }>
						{ __( 'Edit' ) }
					</ToolbarButton>
				</BlockControls>
			) }
			{ allowConvertToLinks && isOpen && (
				<ConvertToLinksModal
					onClose={ closeModal }
					clientId={ clientId }
				/>
			) }

			{ getBlockContent() }
		</>
	);
}

function useGetPages() {
	const { records: pages, hasResolved: hasResolvedPages } = useEntityRecords(
		'postType',
		'page',
		{
			orderby: 'menu_order',
			order: 'asc',
			_fields: [ 'id', 'link', 'parent', 'title', 'menu_order' ],
			per_page: -1,
			context: 'view',
		}
	);

	return [ pages, hasResolvedPages ];
}

function usePageData( pageId = 0 ) {
	const [ pages, hasResolvedPages ] = useGetPages();

	return useMemo( () => {
		// TODO: Once the REST API supports passing multiple values to
		// 'orderby', this can be removed.
		// https://core.trac.wordpress.org/ticket/39037

		const sortedPages = [ ...( pages ?? [] ) ].sort( ( a, b ) => {
			if ( a.menu_order === b.menu_order ) {
				return a.title.rendered.localeCompare( b.title.rendered );
			}
			return a.menu_order - b.menu_order;
		} );
		const pagesByParentId = sortedPages.reduce( ( accumulator, page ) => {
			const { parent } = page;
			if ( accumulator.has( parent ) ) {
				accumulator.get( parent ).push( page );
			} else {
				accumulator.set( parent, [ page ] );
			}
			return accumulator;
		}, new Map() );

		return {
			pagesByParentId,
			hasResolvedPages,
			totalPages: pages?.length ?? null,
		};
	}, [ pageId, pages, hasResolvedPages ] );
}
