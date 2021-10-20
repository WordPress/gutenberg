/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	BlockControls,
	useBlockProps,
	getColorClassName,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useState, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import ConvertToLinksModal from './convert-to-links-modal';
import { ItemSubmenuIcon } from '../navigation-link/icons';

// We only show the edit option when page count is <= MAX_PAGE_COUNT
// Performance of Navigation Links is not good past this value.
const MAX_PAGE_COUNT = 100;

export default function PageListEdit( { context, clientId } ) {
	const { pagesByParentId, totalPages } = usePagesByParentId();

	const isInNavigation = !! context.orientation;
	const allowConvertToLinks = isInNavigation && totalPages <= MAX_PAGE_COUNT;

	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );

	const blockProps = useBlockProps( {
		className: classnames( {
			'has-text-color': !! context.textColor,
			[ getColorClassName(
				'color',
				context.textColor
			) ]: !! context.textColor,
			'has-background': !! context.backgroundColor,
			[ getColorClassName(
				'background-color',
				context.backgroundColor
			) ]: !! context.backgroundColor,
		} ),
		style: { ...context.style?.color },
	} );

	return (
		<>
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
			<div { ...blockProps }>
				<ul className="wp-block-page-list">
					<PageItems pagesByParentId={ pagesByParentId } />
				</ul>
			</div>
		</>
	);
}

function usePagesByParentId() {
	const pagesByParentIdRef = useRef( new Map() );
	const totalPagesRef = useRef( 0 );

	useEffect( () => {
		async function performFetch() {
			const response = await apiFetch( {
				path: addQueryArgs( '/wp/v2/pages', {
					orderby: 'menu_order',
					order: 'asc',
					_fields: [ 'id', 'link', 'parent', 'title' ],
				} ),
				parse: false,
			} );

			const pages = await response.json();
			pagesByParentIdRef.current = pages.reduce(
				( pagesByParentId, page ) => {
					const { parent } = page;
					if ( pagesByParentId.has( parent ) ) {
						pagesByParentId.get( parent ).push( page );
					} else {
						pagesByParentId.set( parent, [ page ] );
					}
					return pagesByParentId;
				},
				new Map()
			);

			totalPagesRef.current = response.headers.get( 'X-WP-Total' );
		}
		performFetch();
	}, [] );

	return {
		pagesByParentId: pagesByParentIdRef.current,
		totalPages: totalPagesRef.current,
	};
}

function PageItems( { pagesByParentId, parentId = 0, depth = 0 } ) {
	const pages = pagesByParentId.get( parentId );

	if ( ! pages?.length ) {
		return [];
	}

	return pages.map( ( page ) => {
		const hasChildren = pagesByParentId.has( page.id );
		const classes = classnames( 'wp-block-pages-list__item', {
			'has-child': hasChildren,
		} );

		return (
			<li key={ page.id } className={ classes }>
				<a
					href={ page.link }
					className="wp-block-pages-list__item__link"
				>
					{ page.title?.rendered }
				</a>
				{ hasChildren && (
					<>
						<span className="wp-block-page-list__submenu-icon">
							<ItemSubmenuIcon />
						</span>
						<ul className="submenu-container">
							<PageItems
								pagesByParentId={ pagesByParentId }
								parentId={ page.id }
								depth={ depth + 1 }
							/>
						</ul>
					</>
				) }
			</li>
		);
	} );
}
