import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { useLayout } from '../block-list/layout';
import { useSettings } from '../use-settings';
import { store as blockEditorStore } from '../../store';
import { getLayoutType } from '../../layouts';

const EMPTY_ARRAY = [];
const DEFAULT_CONTROLS = [ 'none', 'left', 'center', 'right', 'wide', 'full' ];
const WIDE_CONTROLS = [ 'wide', 'full' ];

export default function useAvailableAlignments(
	controls = DEFAULT_CONTROLS,
	layoutOverride
) {
	// Always add the `none` option if not exists.
	if ( ! controls.includes( 'none' ) ) {
		controls = [ 'none', ...controls ];
	}
	const isNoneOnly = controls.length === 1 && controls[ 0 ] === 'none';

	const [ wideControlsEnabled, themeSupportsLayout, isBlockBasedTheme ] =
		useSelect(
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
	const parentLayout = useLayout();
	const layout = layoutOverride ?? parentLayout;

	if ( isNoneOnly ) {
		return EMPTY_ARRAY;
	}

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
 * Splits the alignments a block supports into the ones the parent layout
 * offers and the wide alignments it has taken away.
 *
 * A block whose only alignments are wide and full — Group is the common case —
 * ends up with nothing offered at all in a layout that allows neither, and the
 * control disappears rather than saying so. Reporting the two sets separately
 * lets the menu render `None` alongside the alignments it cannot give.
 *
 * Flex and Grid parents place their children themselves and offer no alignments
 * to anything, so there is no constraint worth explaining there and both sets
 * come back empty.
 *
 * @param {string[]} controls Alignments the block supports.
 *
 * @return {{enabled: Object[], unavailable: string[]}} The split alignments.
 */
export function useAlignmentMenu( controls = DEFAULT_CONTROLS ) {
	const [ globalLayout ] = useSettings( 'layout' );

	const enabled = useAvailableAlignments( controls );
	const layoutOffersAlignments =
		!! useAvailableAlignments( DEFAULT_CONTROLS ).length;

	/*
	 * What the theme itself offers, measured against its global layout rather
	 * than the parent's. A theme that offers no wide size, or no layout at all,
	 * is curating its own options; those alignments were never on the table and
	 * reporting them as withheld would be wrong.
	 */
	const themeLayout = useMemo(
		() => ( { ...globalLayout, type: 'constrained' } ),
		[ globalLayout ]
	);
	const themeNames = useAvailableAlignments(
		DEFAULT_CONTROLS,
		themeLayout
	).map( ( { name } ) => name );

	const enabledNames = enabled.map( ( { name } ) => name );
	const unavailable = layoutOffersAlignments
		? controls.filter(
				( name ) =>
					WIDE_CONTROLS.includes( name ) &&
					themeNames.includes( name ) &&
					! enabledNames.includes( name )
		  )
		: EMPTY_ARRAY;

	return { enabled, unavailable };
}
