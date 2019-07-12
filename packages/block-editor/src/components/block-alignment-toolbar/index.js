/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Toolbar } from '@wordpress/components';
import { withViewportMatch } from '@wordpress/viewport';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { withBlockEditContext } from '../block-edit/context';

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

const DEFAULT_CONTROLS = [ 'left', 'center', 'right', 'wide', 'full' ];
const WIDE_CONTROLS = [ 'wide', 'full' ];

export function BlockAlignmentToolbar( { isCollapsed, value, onChange, controls = DEFAULT_CONTROLS, wideControlsEnabled = false } ) {
	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	const enabledControls = wideControlsEnabled ?
		controls :
		controls.filter( ( control ) => WIDE_CONTROLS.indexOf( control ) === -1 );

	const activeAlignment = BLOCK_ALIGNMENTS_CONTROLS[ value ];

	return (
		<Toolbar
			isCollapsed={ isCollapsed }
			icon={ activeAlignment ? activeAlignment.icon : 'align-left' }
			label={ __( 'Change Alignment' ) }
			controls={
				enabledControls.map( ( control ) => {
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

export default compose(
	withBlockEditContext( ( { clientId } ) => {
		return {
			clientId,
		};
	} ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		const settings = getSettings();
		return {
			wideControlsEnabled: settings.alignWide,
			isCollapsed: true,
		};
	} ),
)( BlockAlignmentToolbar );
