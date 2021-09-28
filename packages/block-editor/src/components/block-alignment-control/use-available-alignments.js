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

const DEFAULT_CONTROLS = [ 'none', 'left', 'center', 'right', 'wide', 'full' ];
const WIDE_CONTROLS = [ 'wide', 'full' ];

export default function useAvailableAlignments( controls = DEFAULT_CONTROLS ) {
	// Always add the `none` option if not exists.
	if ( ! controls.includes( 'none' ) ) {
		controls.unshift( 'none' );
	}
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
		return layoutAlignments.filter( ( { name: alignmentName } ) =>
			controls.includes( alignmentName )
		);
	}

	// Starting here, it's the fallback for themes not supporting the layout config.
	if ( layoutType.name !== 'default' ) {
		return [];
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

	return enabledControls;
}
