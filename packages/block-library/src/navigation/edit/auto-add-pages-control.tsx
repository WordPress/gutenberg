import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { SwitchControl } from '@wordpress/ui';

const META_KEY = 'wp_navigation_auto_add_pages';

type NavigationMenuRecord = {
	meta?: Record< string, unknown >;
	content?: unknown;
	blocks?: { name: string; innerBlocks: unknown[] }[];
};

type BlockLike = { name: string; innerBlocks: BlockLike[] };

function hasPageList( blocks: BlockLike[] ): boolean {
	return blocks.some(
		( block ) =>
			block.name === 'core/page-list' || hasPageList( block.innerBlocks )
	);
}

/**
 * Whether a menu holds a Page List block, which already shows every page, so
 * the "Auto add new pages" setting does not apply to it.
 *
 * @param record The edited menu record.
 */
function menuHasPageList( record?: NavigationMenuRecord ) {
	if ( record?.blocks ) {
		return hasPageList( record.blocks as BlockLike[] );
	}
	return (
		typeof record?.content === 'string' &&
		record.content.includes( '<!-- wp:page-list' )
	);
}

type Props = {
	/** The `wp_navigation` post the block displays. */
	menuId: number;
};

/**
 * The menu's "Auto add new pages" setting.
 *
 * It belongs to the Navigation Menu rather than to the block, so a change is
 * an edit to the menu record and is saved along with the block's other menu
 * edits. It renders nothing for a user who cannot update the menu.
 *
 * @param props
 * @param props.menuId
 */
export default function AutoAddPagesControl( { menuId }: Props ) {
	const { canUpdate, isEnabled, isBlockedByPageList } = useSelect(
		( select ) => {
			const { canUser, getEditedEntityRecord } = select( coreStore );
			const record = getEditedEntityRecord(
				'postType',
				'wp_navigation',
				menuId
			) as NavigationMenuRecord | undefined;
			return {
				canUpdate: !! canUser( 'update', {
					kind: 'postType',
					name: 'wp_navigation',
					id: menuId,
				} ),
				isEnabled: !! record?.meta?.[ META_KEY ],
				isBlockedByPageList: menuHasPageList( record ),
			};
		},
		[ menuId ]
	);
	const { editEntityRecord } = useDispatch( coreStore );

	// A Page List already shows every page, so the setting has no use until
	// the list is turned into links.
	if ( ! canUpdate || isBlockedByPageList ) {
		return null;
	}

	const setEnabled = ( value: boolean ) => {
		editEntityRecord( 'postType', 'wp_navigation', menuId, {
			meta: { [ META_KEY ]: value },
		} );
	};

	return (
		<div className="wp-block-navigation__auto-add-pages">
			<SwitchControl
				label={ __( 'Auto add new pages' ) }
				description={ __(
					'Adds pages to this navigation when they are published.'
				) }
				checked={ isEnabled }
				onCheckedChange={ setEnabled }
			/>
		</div>
	);
}
