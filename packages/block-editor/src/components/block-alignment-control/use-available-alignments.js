/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useLayout } from '../block-list/layout';
import { store as blockEditorStore } from '../../store';
import { getLayoutType } from '../../layouts';

const EMPTY_ARRAY = [];
const DEFAULT_CONTROLS = [ 'none', 'left', 'center', 'right', 'wide', 'full' ];
const WIDE_CONTROLS = [ 'wide', 'full' ];

export default function useAvailableAlignments( controls = DEFAULT_CONTROLS ) {
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
	const layout = useLayout();

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
