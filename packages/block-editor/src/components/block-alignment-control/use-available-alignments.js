/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useLayout } from '../block-list/layout';
import { store as blockEditorStore } from '../../store';

const DEFAULT_CONTROLS = [ 'left', 'center', 'right', 'wide', 'full' ];
const WIDE_CONTROLS = [ 'wide', 'full' ];

export default function useAvailableAlignments( controls = DEFAULT_CONTROLS ) {
	const { wideControlsEnabled = false } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const settings = getSettings();
		return {
			wideControlsEnabled: settings.alignWide,
		};
	}, [] );
	const layout = useLayout();
	const supportsAlignments = layout.type === 'default';

	if ( ! supportsAlignments ) {
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
