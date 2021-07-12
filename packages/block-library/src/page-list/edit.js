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
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
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

const Menu = ( { pagesByParentId, parentId, depth = 0 } ) => {
	return pagesByParentId.get( parentId )?.map( ( page ) => {
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
							<Menu
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
};

export default function PageListEdit( { context, clientId } ) {
	const { textColor, backgroundColor, showSubmenuIcon, style } =
		context || {};

	const [ allowConvertToLinks, setAllowConvertToLinks ] = useState( false );
	const [ pagesByParentId, setPagesByParentId ] = useState( new Map( [ [ 0, [] ] ] ) );

	const blockProps = useBlockProps( {
		className: classnames( {
			'has-text-color': !! textColor,
			[ `has-${ textColor }-color` ]: !! textColor,
			'has-background': !! backgroundColor,
			[ `has-${ backgroundColor }-background-color` ]: !! backgroundColor,
			'show-submenu-icons': !! showSubmenuIcon,
		} ),
		style: { ...style?.color },
	} );

	const isParentNavigation = useSelect(
		( select ) => {
			const { getBlockParentsByBlockName } = select( blockEditorStore );
			return (
				getBlockParentsByBlockName( clientId, 'core/navigation' )
					.length > 0
			);
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( isParentNavigation ) {
			apiFetch( {
				path: addQueryArgs( '/wp/v2/pages', {
					per_page: 1,
					_fields: [ 'id' ],
				} ),
				parse: false,
			} ).then( ( res ) => {
				setAllowConvertToLinks(
					res.headers.get( 'X-WP-Total' ) <= MAX_PAGE_COUNT
				);
			} );
		} else {
			setAllowConvertToLinks( false );
		}
	}, [ isParentNavigation ] );

	useEffect( () => {
		apiFetch( {
			path: addQueryArgs( '/wp/v2/pages', {
				orderby: 'menu_order',
				order: 'asc',
				_fields: [ 'id', 'link', 'parent', 'title' ],
			} ),
		} ).then( ( res ) => {
			const groupedPages = res.reduce( ( parentMap, page ) => {
				const { parent } = page;
				if ( parentMap.has( parent ) ) {
					parentMap.get( parent ).push( page );
				} else {
					parentMap.set( parent, [ page ] );
				}
				return parentMap;
			}, new Map() );
			setPagesByParentId( groupedPages );
		} );
	}, [] );

	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );

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
					<Menu pagesByParentId={pagesByParentId} parentId={ 0 } />
				</ul>
			</div>
		</>
	);
}
