import { useSelect } from '@wordpress/data';
import { useLayout } from '../block-list/layout';
import { useSettings } from '../use-settings';
import { store as blockEditorStore } from '../../store';
import { getLayoutType } from '../../layouts';

const EMPTY_ARRAY = [];
const DEFAULT_CONTROLS = [ 'none', 'left', 'center', 'right', 'wide', 'full' ];
const WIDE_CONTROLS = [ 'wide', 'full' ];

function useAlignmentSettings( isNoneOnly ) {
	return useSelect(
		( select ) => {
			// If `isNoneOnly` is true, we'll be returning early because there is
			// nothing to filter on an empty array. We won't need the info from
			// the `useSelect` but we must call it anyway because Rules of Hooks.
			// So the callback returns early to avoid block editor subscription.
			if ( isNoneOnly ) {
				return [ false, false, false ];
			}

			const settings = select( blockEditorStore ).getSettings();
			return [
				settings.alignWide ?? false,
				settings.supportsLayout,
				settings.__unstableIsBlockBasedTheme,
			];
		},
		[ isNoneOnly ]
	);
}

export default function useAvailableAlignments( controls = DEFAULT_CONTROLS ) {
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
 * @param {string[]} controls Alignments the block supports, including `none`.
 * @param {Object}   layout   Layout to evaluate against.
 * @param {Array}    settings The `[ wideControlsEnabled, themeSupportsLayout, isBlockBasedTheme ]` tuple from `useAlignmentSettings`.
 *
 * @return {Object[]} The alignments the layout offers.
 */
function getAvailableAlignments( controls, layout, settings ) {
	const [ wideControlsEnabled, themeSupportsLayout, isBlockBasedTheme ] =
		settings;
	const layoutType = getLayoutType( layout?.type );

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
 * @param {string[]} controls Alignments the block supports.
 *
 * @return {{enabled: Object[], unavailable: string[]}} The split alignments.
 */
export function useAlignmentMenu( controls = DEFAULT_CONTROLS ) {
	// Always add the `none` option if not exists.
	if ( ! controls.includes( 'none' ) ) {
		controls = [ 'none', ...controls ];
	}
	const isNoneOnly = controls.length === 1 && controls[ 0 ] === 'none';

	const settings = useAlignmentSettings( isNoneOnly );
	const layout = useLayout();
	const [ globalLayout ] = useSettings( 'layout' );

	if ( isNoneOnly ) {
		return { enabled: EMPTY_ARRAY, unavailable: EMPTY_ARRAY };
	}

	const enabled = getAvailableAlignments( controls, layout, settings );
	const layoutOffersAlignments = !! getAvailableAlignments(
		DEFAULT_CONTROLS,
		layout,
		settings
	).length;

	if ( ! layoutOffersAlignments ) {
		return { enabled, unavailable: EMPTY_ARRAY };
	}

	const themeNames = getAvailableAlignments(
		DEFAULT_CONTROLS,
		{ ...globalLayout, type: 'constrained' },
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
