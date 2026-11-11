import { useSelect } from '@wordpress/data';
import { getBlockSupport } from '@wordpress/blocks';
import { useLayout } from '../block-list/layout';
import { useBlockEditContext } from '../block-edit';
import { useSettings } from '../use-settings';
import { store as blockEditorStore } from '../../store';
import { getLayoutType } from '../../layouts';
import type {
	Layout,
	LayoutAlignment,
	LayoutBlockSupport,
	LayoutType,
} from '../../layouts/types';
import type { AlignmentMenu, AlignmentSettings } from './types';

const EMPTY_ARRAY: never[] = [];
const DEFAULT_CONTROLS = [ 'none', 'left', 'center', 'right', 'wide', 'full' ];
const WIDE_CONTROLS = [ 'wide', 'full' ];

function useAlignmentSettings( isNoneOnly: boolean ): AlignmentSettings {
	return useSelect(
		( select ) => {
			// If `isNoneOnly` is true, we'll be returning early because there is
			// nothing to filter on an empty array. We won't need the info from
			// the `useSelect` but we must call it anyway because Rules of Hooks.
			// So the callback returns early to avoid block editor subscription.
			if ( isNoneOnly ) {
				return {
					wideControlsEnabled: false,
					themeSupportsLayout: false,
					isBlockBasedTheme: false,
				};
			}

			const settings = select( blockEditorStore ).getSettings();
			return {
				wideControlsEnabled: settings.alignWide ?? false,
				themeSupportsLayout: settings.supportsLayout,
				isBlockBasedTheme: settings.__unstableIsBlockBasedTheme,
			};
		},
		[ isNoneOnly ]
	);
}

/**
 * Whether the layout of the current block's parent can be edited by the user.
 * When it cannot, alignments the layout withholds are not something to offer
 * a way out of, so they are not listed as unavailable. A parent without layout
 * support has no layout setting to change, so the same applies.
 *
 * @return False when the parent lacks layout support or has `allowEditing` set to false.
 */
function useIsParentLayoutEditable(): boolean {
	const { clientId } = useBlockEditContext();
	return useSelect(
		( select ) => {
			if ( ! clientId ) {
				return true;
			}
			const { getBlockRootClientId, getBlockName } =
				select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			const parentName = rootClientId && getBlockName( rootClientId );
			if ( ! rootClientId || ! parentName ) {
				return true;
			}
			// Only the block type's support determines whether its layout is editable.
			const layoutSupport =
				getBlockSupport( parentName, 'layout' ) ||
				getBlockSupport( parentName, '__experimentalLayout' );
			if ( ! layoutSupport ) {
				return false;
			}
			const supportAllowEditing = ( layoutSupport as LayoutBlockSupport )
				.allowEditing;
			if ( typeof supportAllowEditing === 'boolean' ) {
				return supportAllowEditing;
			}
			return true;
		},
		[ clientId ]
	);
}

export default function useAvailableAlignments(
	controls: string[] = DEFAULT_CONTROLS
): LayoutAlignment[] {
	// Always add the `none` option if not exists.
	if ( ! controls.includes( 'none' ) ) {
		controls = [ 'none', ...controls ];
	}
	const isNoneOnly = controls.length === 1 && controls[ 0 ] === 'none';

	const settings = useAlignmentSettings( isNoneOnly );
	const layout = useLayout();

	if ( isNoneOnly ) {
		return EMPTY_ARRAY;
	}

	return getAvailableAlignments( controls, layout, settings );
}

/**
 * The store-free part of `useAvailableAlignments`, so the same rules can be
 * evaluated against more than one layout without a subscription for each.
 *
 * @param controls                     Alignments the block supports, including `none`.
 * @param layout                       Layout to evaluate against.
 * @param settings                     Editor settings from `useAlignmentSettings`.
 * @param settings.wideControlsEnabled Whether the theme enables wide alignments.
 * @param settings.themeSupportsLayout Whether the theme supports the layout config.
 * @param settings.isBlockBasedTheme   Whether the theme is block based.
 *
 * @return The alignments the layout offers.
 */
function getAvailableAlignments(
	controls: string[],
	layout: Layout,
	{
		wideControlsEnabled,
		themeSupportsLayout,
		isBlockBasedTheme,
	}: AlignmentSettings
): LayoutAlignment[] {
	// Every layout type, including the default one, is registered.
	const layoutType = getLayoutType( layout?.type ) as LayoutType;

	if ( themeSupportsLayout ) {
		const layoutAlignments = layoutType.getAlignments(
			layout,
			isBlockBasedTheme
		);
		const alignments = layoutAlignments.filter( ( alignment ) =>
			controls.includes( alignment.name )
		);
		// While we treat `none` as an alignment, we shouldn't return it if no
		// other alignments exist.
		if ( alignments.length === 1 && alignments[ 0 ].name === 'none' ) {
			return EMPTY_ARRAY;
		}
		return alignments;
	}

	// Starting here, it's the fallback for themes not supporting the layout config.
	if ( layoutType.name !== 'default' && layoutType.name !== 'constrained' ) {
		return EMPTY_ARRAY;
	}

	const alignments = controls
		.filter( ( control ) => {
			if ( layout.alignments ) {
				return layout.alignments.includes( control );
			}

			if ( ! wideControlsEnabled && WIDE_CONTROLS.includes( control ) ) {
				return false;
			}

			return DEFAULT_CONTROLS.includes( control );
		} )
		.map( ( name ) => ( { name } ) );

	// While we treat `none` as an alignment, we shouldn't return it if no
	// other alignments exist.
	if ( alignments.length === 1 && alignments[ 0 ].name === 'none' ) {
		return EMPTY_ARRAY;
	}

	return alignments;
}

/**
 * Returns the alignments a block supports, split into the ones the parent
 * layout offers (`enabled`) and the wide alignments it does not (`unavailable`).
 *
 * An alignment is only `unavailable` when the block supports it, the theme
 * offers it at the root, and the parent layout does not. The theme check is
 * measured against the global layout settings, so a theme that sets no wide
 * size, or no layout at all, is curating its own options rather than
 * withholding them. Flex and Grid parents never offer alignments to anything,
 * so under those both lists are empty.
 *
 * @param controls Alignments the block supports.
 *
 * @return The split alignments.
 */
export function useAlignmentMenu(
	controls: string[] = DEFAULT_CONTROLS
): AlignmentMenu {
	// Always add the `none` option if not exists.
	if ( ! controls.includes( 'none' ) ) {
		controls = [ 'none', ...controls ];
	}
	const isNoneOnly = controls.length === 1 && controls[ 0 ] === 'none';

	const settings = useAlignmentSettings( isNoneOnly );
	const layout = useLayout();
	const [ globalLayout ] = useSettings( 'layout' );
	const isParentLayoutEditable = useIsParentLayoutEditable();

	if ( isNoneOnly ) {
		return { enabled: EMPTY_ARRAY, unavailable: EMPTY_ARRAY };
	}

	const enabled = getAvailableAlignments( controls, layout, settings );
	const layoutOffersAlignments = !! getAvailableAlignments(
		DEFAULT_CONTROLS,
		layout,
		settings
	).length;

	if ( ! layoutOffersAlignments || ! isParentLayoutEditable ) {
		return { enabled, unavailable: EMPTY_ARRAY };
	}

	const themeNames = getAvailableAlignments(
		DEFAULT_CONTROLS,
		// The `layout` setting is a layout object.
		{ ...( globalLayout as Layout ), type: 'constrained' },
		settings
	).map( ( { name } ) => name );
	const enabledNames = enabled.map( ( { name } ) => name );
	const unavailable = controls.filter(
		( name ) =>
			WIDE_CONTROLS.includes( name ) &&
			themeNames.includes( name ) &&
			! enabledNames.includes( name )
	);

	return { enabled, unavailable };
}
