/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Toolbar } from 'components';

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
};

const DEFAULT_CONTROLS = [ 'left', 'center', 'right' ];

export default function BlockAlignmentToolbar( { value, onChange, controls = DEFAULT_CONTROLS } ) {
	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	return (
		<Toolbar
			controls={
				controls.map( control => {
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
