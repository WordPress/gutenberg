import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { SelectControl, Stack, Text } from '@wordpress/ui';
import NavigationMenuEditor from './menu-editor';
import { getSitePartArea } from './constants';
import {
	replaceBlock,
	type SitePartBlock,
	type SitePartContents,
} from './get-site-part-contents';

const NAVIGATION = 'core/navigation';
const MENUS_QUERY = {
	per_page: -1,
	status: [ 'publish', 'draft' ],
	order: 'desc',
	orderby: 'date',
};

interface MenuItem {
	value: string;
	label: string;
}

/**
 * Names a menu slot. A part with one Navigation block has one "Menu"; with
 * more, each slot takes the block's accessible name, or its position.
 *
 * @param navigation The Navigation block.
 * @param index      Its position among the part's Navigation blocks.
 * @param count      How many Navigation blocks the part has.
 * @return The slot's label.
 */
function getSlotLabel(
	navigation: SitePartBlock,
	index: number,
	count: number
): string {
	if ( count === 1 ) {
		return __( 'Menu' );
	}
	return (
		navigation.attributes?.ariaLabel ||
		sprintf(
			/* translators: %d: Position of the menu in the site part, e.g. "2". */
			__( 'Menu %d' ),
			index + 1
		)
	);
}

/**
 * One Navigation block in a site part: which menu it shows, a deliberate
 * step to show another, and the menu's items.
 *
 * @param props             Component props.
 * @param props.label       The slot's name.
 * @param props.description Explains the picker.
 * @param props.navigation  The Navigation block.
 * @param props.menus       The site's menus, or `null` while they load.
 * @param props.onChoose    Shows the chosen menu in the block.
 */
function MenuSlot( {
	label,
	description,
	navigation,
	menus,
	onChoose,
}: {
	label: string;
	description?: string;
	navigation: SitePartBlock;
	menus: MenuItem[] | null;
	onChoose: ( ref: number ) => void;
} ) {
	const [ isChanging, setIsChanging ] = useState( false );
	const menuId: number | undefined = navigation.attributes?.ref;
	const hasOwnLinks = ! menuId && !! navigation.innerBlocks?.length;
	const selectedItem =
		menus?.find( ( item ) => item.value === String( menuId ) ) ?? null;

	let currentMenu;
	if ( selectedItem ) {
		currentMenu = selectedItem.label;
	} else if ( hasOwnLinks ) {
		currentMenu = __( 'Links added on the canvas' );
	} else if ( menus ) {
		currentMenu = menuId
			? __( 'This menu no longer exists.' )
			: __( 'None chosen. Your most recent menu shows instead.' );
	}

	return (
		<Stack direction="column" gap="lg" render={ <section /> }>
			{ isChanging ? (
				<Stack direction="column" gap="sm">
					<SelectControl
						label={ label }
						description={
							hasOwnLinks
								? __(
										'Choosing a menu replaces the links added on the canvas.'
									)
								: description
						}
						placeholder={ __( 'Choose a menu' ) }
						items={ menus ?? [] }
						value={ selectedItem }
						onValueChange={ ( item ) => {
							const ref = Number( item?.value );
							if ( ref ) {
								onChoose( ref );
								setIsChanging( false );
							}
						} }
						disabled={ ! menus }
					/>
					<Stack direction="row" justify="flex-end">
						<Button
							variant="tertiary"
							size="compact"
							onClick={ () => setIsChanging( false ) }
						>
							{ __( 'Cancel' ) }
						</Button>
					</Stack>
				</Stack>
			) : (
				<Stack
					direction="row"
					align="center"
					justify="space-between"
					gap="md"
				>
					<Stack direction="column" gap="xs">
						<Text variant="body-sm">{ label }</Text>
						<Text variant="body-md" render={ <strong /> }>
							{ currentMenu }
						</Text>
					</Stack>
					<Button
						variant="secondary"
						size="compact"
						onClick={ () => setIsChanging( true ) }
						disabled={ ! menus?.length }
						accessibleWhenDisabled
						label={ sprintf(
							/* translators: %s: Name of the menu slot, e.g. "Menu" or "Footer 1". */
							__( 'Change %s' ),
							label
						) }
						showTooltip={ false }
					>
						{ __( 'Change' ) }
					</Button>
				</Stack>
			) }
			{ menuId ? <NavigationMenuEditor id={ menuId } /> : null }
		</Stack>
	);
}

/**
 * The menu slots in a site part: one per Navigation block. Each shows which
 * menu the block uses and edits that menu's items in place. Switching to
 * another menu changes the menu across every page that uses the part, so it
 * takes a deliberate step: the picker only appears after choosing "Change".
 *
 * Picking a menu edits the part, which saves with it; editing the items edits
 * the menu, which saves on its own.
 *
 * Needs the editor assets to have loaded, as `NavigationMenuEditor` does.
 *
 * @param props           Component props.
 * @param props.area      The template part area.
 * @param props.blocks    The part's blocks.
 * @param props.contents  What the part holds.
 * @param props.setBlocks Replaces the part's blocks.
 */
export default function SitePartMenu( {
	area,
	blocks,
	contents,
	setBlocks,
}: {
	area: string;
	blocks: SitePartBlock[];
	contents: SitePartContents;
	setBlocks: ( blocks: SitePartBlock[] ) => void;
} ) {
	const menuRecords = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords(
				'postType',
				'wp_navigation',
				MENUS_QUERY
			) as Array< { id: number; title: { rendered: string } } > | null,
		[]
	);
	const menus = menuRecords
		? menuRecords.map( ( menu ) => ( {
				value: String( menu.id ),
				label:
					decodeEntities( menu.title?.rendered ?? '' ) ||
					__( '(no title)' ),
			} ) )
		: null;
	const { navigations } = contents;
	const description = getSitePartArea( area )?.menuDescription;

	// A block that shows a saved menu takes its links from the menu, so the
	// links typed into it go.
	const onChoose = ( index: number, ref: number ) =>
		setBlocks(
			replaceBlock( blocks, NAVIGATION, index, ( block ) => ( {
				...block,
				attributes: { ...block.attributes, ref },
				innerBlocks: [],
			} ) )
		);

	return (
		<Stack direction="column" gap="2xl">
			{ navigations.map( ( navigation, index ) => (
				<MenuSlot
					key={ navigation.clientId ?? index }
					label={ getSlotLabel(
						navigation,
						index,
						navigations.length
					) }
					description={
						navigations.length === 1 ? description : undefined
					}
					navigation={ navigation }
					menus={ menus }
					onChoose={ ( ref ) => onChoose( index, ref ) }
				/>
			) ) }
		</Stack>
	);
}
