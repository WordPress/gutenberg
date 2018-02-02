/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Toolbar, withContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { shortcuts } from '../alignment-shortcuts';

const BLOCK_ALIGNMENTS_CONTROLS = {
	left: {
		icon: 'align-left',
		title: __( 'Align left' ),
		shortcut: shortcuts.left,
	},
	center: {
		icon: 'align-center',
		title: __( 'Align center' ),
		shortcut: shortcuts.center,
	},
	right: {
		icon: 'align-right',
		title: __( 'Align right' ),
		shortcut: shortcuts.right,
	},
	wide: {
		icon: 'align-wide',
		title: __( 'Wide width' ),
	},
	full: {
		icon: 'align-full-width',
		title: __( 'Full width' ),
	},
};

const DEFAULT_CONTROLS = [ 'left', 'center', 'right', 'wide', 'full' ];
const WIDE_CONTROLS = [ 'wide', 'full' ];

export function BlockAlignmentToolbar( { value, onChange, controls = DEFAULT_CONTROLS, wideControlsEnabled = false } ) {
	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	const enabledControls = wideControlsEnabled ?
		controls :
		controls.filter( ( control ) => WIDE_CONTROLS.indexOf( control ) === -1 );

	return (
		<Toolbar
			controls={
				enabledControls.map( control => {
					return {
						...BLOCK_ALIGNMENTS_CONTROLS[ control ],
						isActive: value === control,
						onClick: applyOrUnset( control ),
					};
				} )
			}
		/>
	);
}

export default withContext( 'editor' )(
	( settings ) => ( {
		wideControlsEnabled: settings.alignWide,
	} )
)( BlockAlignmentToolbar );
