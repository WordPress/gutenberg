import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { parse } from '@wordpress/block-serialization-default-parser';
import { __, _n, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { store as editorStore } from '../../store';

const META_KEY = 'wp_navigation_auto_add_pages';
const LINK_BLOCKS = [ 'core/navigation-link', 'core/navigation-submenu' ];

type ParsedBlock = ReturnType< typeof parse >[ number ];

type NavigationMenuRecord = {
	id: number;
	title?: { raw?: string; rendered?: string };
	content?: { raw?: string };
	meta?: Record< string, unknown >;
};

type MenuTarget = {
	id: number;
	title: string;
	/** The label of the parent page's link the new link goes under. */
	parentLabel?: string;
};

/**
 * Finds the first Navigation Link or Submenu block in a tree that points at
 * a page. Mirrors the server's check so the panel only lists menus the server
 * will actually add the page to.
 *
 * @param blocks Parsed blocks.
 * @param pageId Page ID.
 */
function findLinkToPage(
	blocks: ParsedBlock[],
	pageId: number
): ParsedBlock | undefined {
	for ( const block of blocks ) {
		const attrs = ( block.attrs ?? {} ) as Record< string, unknown >;
		if (
			block.blockName &&
			LINK_BLOCKS.includes( block.blockName ) &&
			Number( attrs.id ) === pageId &&
			( attrs.kind === 'post-type' || attrs.type === 'page' )
		) {
			return block;
		}
		const inner = findLinkToPage( block.innerBlocks ?? [], pageId );
		if ( inner ) {
			return inner;
		}
	}
	return undefined;
}

function getMenuEditorUrl( menuId: number ) {
	const isExtensibleSiteEditor = !! (
		window as Window & { __experimentalExtensibleSiteEditor?: boolean }
	 ).__experimentalExtensibleSiteEditor;

	return isExtensibleSiteEditor
		? addQueryArgs( 'admin.php', {
				page: 'site-editor-v2',
				p: `/navigation/edit/${ menuId }`,
			} )
		: addQueryArgs( 'site-editor.php', {
				p: `/wp_navigation/${ menuId }`,
			} );
}

/**
 * Lists the Navigation Menus a page is added to when it is published: the
 * menus with "Auto add pages" switched on that do not link to the page yet.
 * A child page is only added to a menu that links to its parent.
 */
export default function MaybeNavigationMenusPanel() {
	const targets = useSelect( ( select ): MenuTarget[] => {
		const { getCurrentPostType, getCurrentPostId, getEditedPostAttribute } =
			select( editorStore );
		if ( getCurrentPostType() !== 'page' ) {
			return [];
		}
		const menus = select( coreStore ).getEntityRecords(
			'postType',
			'wp_navigation',
			{ per_page: -1, status: 'any' }
		) as NavigationMenuRecord[] | null;
		if ( ! menus?.length ) {
			return [];
		}

		const pageId = Number( getCurrentPostId() );
		const parentId = Number( getEditedPostAttribute( 'parent' ) ) || 0;
		const result: MenuTarget[] = [];
		for ( const menu of menus ) {
			if ( ! menu.meta?.[ META_KEY ] ) {
				continue;
			}
			const blocks = parse( menu.content?.raw ?? '' );
			if ( findLinkToPage( blocks, pageId ) ) {
				continue;
			}
			const title = decodeEntities(
				menu.title?.raw || menu.title?.rendered || ''
			);
			if ( ! parentId ) {
				result.push( { id: menu.id, title } );
				continue;
			}
			const parentLink = findLinkToPage( blocks, parentId );
			if ( ! parentLink ) {
				continue;
			}
			const parentLabel = (
				parentLink.attrs as Record< string, unknown > | undefined
			 )?.label;
			result.push( {
				id: menu.id,
				title,
				parentLabel:
					typeof parentLabel === 'string'
						? decodeEntities( parentLabel )
						: undefined,
			} );
		}
		return result;
	}, [] );

	if ( ! targets.length ) {
		return null;
	}

	const summary =
		targets.length === 1
			? targets[ 0 ].title
			: sprintf(
					/* translators: %d: Number of navigation menus. */
					_n( '%d menu', '%d menus', targets.length ),
					targets.length
				);

	return (
		<PanelBody
			initialOpen={ false }
			title={ sprintf(
				/* translators: %s: A menu name, or a count of menus. */
				__( 'Menus: %s' ),
				summary
			) }
		>
			<p>
				{ __(
					'A link to this page is added to these menus when it is published.'
				) }
			</p>
			<ul className="editor-post-publish-panel__menus">
				{ targets.map( ( { id, title, parentLabel } ) => (
					<li key={ id }>
						<a href={ getMenuEditorUrl( id ) }>
							{ title || __( 'Untitled menu' ) }
						</a>
						{ parentLabel &&
							sprintf(
								/* translators: %s: The label of the parent page's link in the menu. */
								__( ', under %s' ),
								parentLabel
							) }
					</li>
				) ) }
			</ul>
		</PanelBody>
	);
}
