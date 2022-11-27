/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	BlockControls,
	useBlockProps,
	useInnerBlocksProps,
	getColorClassName,
} from '@wordpress/block-editor';
import {
	PanelBody,
	ToolbarButton,
	Spinner,
	Notice,
	ComboboxControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import ConvertToLinksModal from './convert-to-links-modal';

// We only show the edit option when page count is <= MAX_PAGE_COUNT
// Performance of Navigation Links is not good past this value.
const MAX_PAGE_COUNT = 100;

export default function PageListEdit( {
	context,
	clientId,
	attributes,
	setAttributes,
} ) {
	const { parentPageID } = attributes;
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

	const makeBlockTemplate = ( parentId = 0 ) => {
		const pages = pagesByParentId.get( parentId );

		if ( ! pages?.length ) {
			return [];
		}

		return pages.reduce( ( template, page ) => {
			const hasChildren = pagesByParentId.has( page.id );
			const pageProps = {
				id: page.id,
				label: page.title?.rendered,
				title: page.title?.rendered,
				link: page.url,
				hasChildren,
			};
			let item = null;
			const children = makeBlockTemplate( page.id );
			item = [ 'core/page-list-item', pageProps, children ];

			template.push( item );

			return template;
		}, [] );
	};

	const pagesTemplate = useMemo( makeBlockTemplate, [ pagesByParentId ] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: pagesTemplate,
		templateLock: 'all',
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

		if ( totalPages > 0 ) {
			return <ul { ...innerBlocksProps }></ul>;
		}
	};

	const useParentOptions = () => {
		const [ pages ] = useGetPages();
		return pages?.reduce( ( accumulator, page ) => {
			accumulator.push( {
				value: page.id,
				label: page.title.rendered,
			} );
			return accumulator;
		}, [] );
	};

	return (
		<>
			<InspectorControls>
				<PanelBody>
					<ComboboxControl
						className="editor-page-attributes__parent"
						label={ __( 'Parent page' ) }
						value={ parentPageID }
						options={ useParentOptions() }
						onChange={ ( value ) =>
							setAttributes( { parentPageID: value ?? 0 } )
						}
						help={ __(
							'Choose a page to show only its subpages.'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			{ allowConvertToLinks && (
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

		if ( pageId !== 0 ) {
			return pages.find( ( page ) => page.id === pageId );
		}

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
