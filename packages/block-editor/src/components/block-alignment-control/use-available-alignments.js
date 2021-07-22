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

const DEFAULT_CONTROLS = [ 'left', 'center', 'right', 'wide', 'full' ];
const WIDE_CONTROLS = [ 'wide', 'full' ];

export default function useAvailableAlignments( controls = DEFAULT_CONTROLS ) {
	const { wideControlsEnabled = false, themeSupportsLayout } = useSelect(
		( select ) => {
			const { getSettings } = select( blockEditorStore );
			const settings = getSettings();
			return {
				wideControlsEnabled: settings.alignWide,
				themeSupportsLayout: settings.supportsLayout,
			};
		},
		[]
	);
	const layout = useLayout();
	const layoutType = getLayoutType( layout?.type );
	const layoutAlignments = layoutType.getAlignments( layout );

	if ( themeSupportsLayout ) {
		return layoutAlignments.filter( ( control ) =>
			controls.includes( control )
		);
	}

	// Starting here, it's the fallback for themes not supporting the layout config.
	if ( layoutType.name !== 'default' ) {
		return [];
	}
	const { alignments: availableAlignments = DEFAULT_CONTROLS } = layout;
	const enabledControls = controls.filter(
		( control ) =>
			( layout.alignments || // Ignore the global wideAlignment check if the layout explicitely defines alignments.
				wideControlsEnabled ||
				! WIDE_CONTROLS.includes( control ) ) &&
			availableAlignments.includes( control )
	);

	return enabledControls;
}
