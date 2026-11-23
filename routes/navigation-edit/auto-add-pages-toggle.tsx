import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { SwitchControl } from '@wordpress/ui';

const NAVIGATION_POST_TYPE = 'wp_navigation';
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

/**
 * The menu's "Auto add new pages" setting. A change is an edit to the menu record
 * and is saved with the screen's other changes.
 *
 * It renders nothing while the menu has a Page List.
 *
 * @param props
 * @param props.id        The `wp_navigation` post ID.
 * @param props.className Class for the wrapper.
 */
export default function AutoAddPagesToggle( {
	id,
	className,
}: {
	id: number;
	className?: string;
} ) {
	const { isEnabled, isBlockedByPageList } = useSelect(
		( select ) => {
			const record = select( coreStore ).getEditedEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				id
			) as NavigationMenuRecord | undefined;
			return {
				isEnabled: !! record?.meta?.[ META_KEY ],
				isBlockedByPageList: menuHasPageList( record ),
			};
		},
		[ id ]
	);
	const { editEntityRecord } = useDispatch( coreStore );

	const onCheckedChange = ( value: boolean ) => {
		editEntityRecord( 'postType', NAVIGATION_POST_TYPE, id, {
			meta: { [ META_KEY ]: value },
		} );
	};

	// A Page List already shows every page, so the setting has no use until
	// the list is turned into links.
	if ( isBlockedByPageList ) {
		return null;
	}

	return (
		<div className={ className }>
			<SwitchControl
				label={ __( 'Auto add new pages' ) }
				description={ __(
					'Adds pages to this navigation when they are published.'
				) }
				checked={ isEnabled }
				onCheckedChange={ onCheckedChange }
			/>
		</div>
	);
}
