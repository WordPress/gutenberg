/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Toolbar, withContext } from '@wordpress/components';

const BLOCK_ALIGNMENTS_CONTROLS = {
	left: {
		icon: 'align-left',
		title: __( 'Align left' ),
	},
	center: {
		icon: 'align-center',
		title: __( 'Align center' ),
	},
	right: {
		icon: 'align-right',
		title: __( 'Align right' ),
	},
	wide: {
		icon: 'align-wide',
		title: __( 'Wide width' ),
	},
	full: {
		icon: 'align-full-width',
		title: __( 'Full width' ),
	},
	pullLeft: {
		icon: 'align-pull-left',
		title: __( 'Pull left' ),
	},
	pullRight: {
		icon: 'align-pull-right',
		title: __( 'Pull right' ),
	},
	twoFold: {
		icon: 'layout-two-fold',
		title: __( 'Two Fold' ),
	},
};

const DEFAULT_CONTROLS = [ 'left', 'center', 'right', 'pullLeft', 'pullRight', 'wide', 'full', 'twoFold' ];
const WIDE_CONTROLS = [ 'pullLeft', 'pullRight', 'wide', 'full', 'twoFold' ];

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
