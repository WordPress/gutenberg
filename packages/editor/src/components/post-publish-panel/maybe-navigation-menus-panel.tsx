import { PanelBody } from '@wordpress/components';
import { CheckboxControl, Link } from '@wordpress/ui';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { parse } from '@wordpress/block-serialization-default-parser';
import { __, _n, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { store as editorStore } from '../../store';

const META_KEY = 'wp_navigation_auto_add_pages';
const CHOICE_FIELD = 'navigation_menus';
const LINK_BLOCKS = [ 'core/navigation-link', 'core/navigation-submenu' ];

type ParsedBlock = ReturnType< typeof parse >[ number ];

type NavigationMenuRecord = {
	id: number;
	title?: { raw?: string; rendered?: string };
	content?: { raw?: string };
	meta?: Record< string, unknown >;
};

type MenuRow = {
	id: number;
	title: string;
	/** The menu already links to the page; the link goes live with it. */
	isLinked: boolean;
	/** The "Auto add pages" setting would add the page to this menu. */
	isAddedByDefault: boolean;
	/** The label of the parent page's link the new link goes under. */
	parentLabel?: string;
};

/**
 * Finds the first Navigation Link or Submenu block in a tree that points at
 * a page. Mirrors the server's check so the panel reflects what the server
 * does on publish.
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
 * Lets the author choose the Navigation Menus a page is added to when it is
 * published. The menus with "Auto add pages" switched on that would add the
 * page start checked, a menu that already links to the page is checked and
 * cannot be unchecked, and any other menu can be checked to add the page to
 * it. A change is sent with the page as its `navigation_menus` field, which
 * replaces the setting's choice for this page only.
 */
export default function MaybeNavigationMenusPanel() {
	// Only stable values come out of the selector: the records array keeps
	// its reference until the menus change, and the rows derive from it.
	const { isPage, menus, pageId, parentId, choice } = useSelect(
		( select ) => {
			const {
				getCurrentPostType,
				getCurrentPostId,
				getEditedPostAttribute,
			} = select( editorStore );
			const _isPage = getCurrentPostType() === 'page';
			return {
				isPage: _isPage,
				menus: _isPage
					? ( select( coreStore ).getEntityRecords(
							'postType',
							'wp_navigation',
							{ per_page: -1, status: 'any' }
						) as NavigationMenuRecord[] | null )
					: null,
				pageId: Number( getCurrentPostId() ),
				parentId: Number( getEditedPostAttribute( 'parent' ) ) || 0,
				choice: getEditedPostAttribute( CHOICE_FIELD ) as
					number[] | undefined,
			};
		},
		[]
	);
	const rows = useMemo( (): MenuRow[] => {
		if ( ! isPage || ! menus?.length ) {
			return [];
		}
		return menus.map( ( menu ) => {
			const blocks = parse( menu.content?.raw ?? '' );
			const title = decodeEntities(
				menu.title?.raw || menu.title?.rendered || ''
			);
			if ( findLinkToPage( blocks, pageId ) ) {
				return {
					id: menu.id,
					title,
					isLinked: true,
					isAddedByDefault: false,
				};
			}
			const parentLink = parentId
				? findLinkToPage( blocks, parentId )
				: undefined;
			const parentLabel = (
				parentLink?.attrs as Record< string, unknown > | undefined
			 )?.label;
			return {
				id: menu.id,
				title,
				isLinked: false,
				isAddedByDefault:
					!! menu.meta?.[ META_KEY ] &&
					( ! parentId || !! parentLink ),
				parentLabel:
					typeof parentLabel === 'string'
						? decodeEntities( parentLabel )
						: undefined,
			};
		} );
	}, [ isPage, menus, pageId, parentId ] );
	const { editPost } = useDispatch( editorStore );

	if ( ! rows.length ) {
		return null;
	}

	const checkedIds = new Set(
		choice ??
			rows
				.filter( ( row ) => row.isAddedByDefault )
				.map( ( row ) => row.id )
	);
	const isChecked = ( row: MenuRow ) =>
		row.isLinked || checkedIds.has( row.id );
	const checkedRows = rows.filter( isChecked );

	const setChecked = ( row: MenuRow, value: boolean ) => {
		const next = rows
			.filter( ( other ) =>
				other.id === row.id
					? value
					: ! other.isLinked && checkedIds.has( other.id )
			)
			.map( ( other ) => other.id );
		editPost( { [ CHOICE_FIELD ]: next } );
	};

	let summary: string;
	if ( checkedRows.length === 0 ) {
		summary = __( 'None' );
	} else if ( checkedRows.length === 1 ) {
		summary = checkedRows[ 0 ].title || __( 'Untitled menu' );
	} else {
		summary = sprintf(
			/* translators: %d: Number of navigation menus. */
			_n( '%d menu', '%d menus', checkedRows.length ),
			checkedRows.length
		);
	}

	return (
		<PanelBody
			initialOpen={ false }
			title={ sprintf(
				/* translators: %s: A menu name, a count of menus, or "None". */
				__( 'Menus: %s' ),
				summary
			) }
		>
			<p>
				{ __(
					'This page appears in the checked menus once it is published.'
				) }
			</p>
			<ul className="editor-post-publish-panel__menus">
				{ rows.map( ( row ) => {
					const title = row.title || __( 'Untitled menu' );
					return (
						<li key={ row.id }>
							<CheckboxControl
								label={ title }
								description={
									row.parentLabel &&
									sprintf(
										/* translators: %s: The label of the parent page's link in the menu. */
										__( 'Under %s' ),
										row.parentLabel
									)
								}
								checked={ isChecked( row ) }
								disabled={ row.isLinked }
								onCheckedChange={ ( value: boolean ) =>
									setChecked( row, value )
								}
							/>
							<Link
								href={ getMenuEditorUrl( row.id ) }
								openInNewTab
								aria-label={ sprintf(
									/* translators: %s: A menu name. */
									__( 'View %s' ),
									title
								) }
							>
								{ __( 'View' ) }
							</Link>
						</li>
					);
				} ) }
			</ul>
		</PanelBody>
	);
}
