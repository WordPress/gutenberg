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
	const {
		wideControlsEnabled = false,
		themeSupportsLayout,
		isBlockBasedTheme,
	} = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const settings = getSettings();
		return {
			wideControlsEnabled: settings.alignWide,
			themeSupportsLayout: settings.supportsLayout,
			isBlockBasedTheme: settings.__unstableIsBlockBasedTheme,
		};
	}, [] );
	const layout = useLayout();
	const layoutType = getLayoutType( layout?.type );
	const layoutAlignments = layoutType.getAlignments(
		layout,
		isBlockBasedTheme
	);

	if ( themeSupportsLayout ) {
		const alignments = layoutAlignments.filter(
			( { name: alignmentName } ) => controls.includes( alignmentName )
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
	const { alignments: availableAlignments = DEFAULT_CONTROLS } = layout;
	const enabledControls = controls
		.filter(
			( control ) =>
				( layout.alignments || // Ignore the global wideAlignment check if the layout explicitely defines alignments.
					wideControlsEnabled ||
					! WIDE_CONTROLS.includes( control ) ) &&
				availableAlignments.includes( control )
		)
		.map( ( enabledControl ) => ( { name: enabledControl } ) );

	// While we treat `none` as an alignment, we shouldn't return it if no
	// other alignments exist.
	if (
		enabledControls.length === 1 &&
		enabledControls[ 0 ].name === 'none'
	) {
		return EMPTY_ARRAY;
	}

	return enabledControls;
}
