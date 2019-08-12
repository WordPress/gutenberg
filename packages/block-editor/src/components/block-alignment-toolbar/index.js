/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Toolbar } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { withBlockEditContext } from '../block-edit/context';

const BLOCK_ALIGNMENTS_CONTROLS = {
	left: {
		icon: 'align-left',
		title: __( 'Align Left' ),
	},
	center: {
		icon: 'align-center',
		title: __( 'Align Center' ),
	},
	right: {
		icon: 'align-right',
		title: __( 'Align Right' ),
	},
	wide: {
		icon: 'align-wide',
		title: __( 'Wide Width' ),
	},
	full: {
		icon: 'align-full-width',
		title: __( 'Full Width' ),
	},
	fullHeight: {
		icon: 'image-flip-vertical',
		title: __( 'Full height' ),
	},
};

const DEFAULT_CONTROLS = [ [ 'left', 'center', 'right', 'wide', 'full' ], [ 'fullHeight' ] ];
const DEFAULT_CONTROL = 'center';
const WIDE_CONTROLS = [ 'wide', 'full', 'fullHeight' ];

export function BlockAlignmentToolbar( {
	value,
	onChange,
	controls = DEFAULT_CONTROLS,
	isCollapsed = true,
	wideControlsEnabled = false,
} ) {
	/**
	 * Control button handler.
	 *
	 * @param {string}    align Alignment value to set in the toolbar.
	 * @return {Function} Handler function.
	 */
	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	/**
	 * Given the control name returns a control object.
	 *
	 * @param {string}  name Control name
	 * @return {Object} Control object.
	 */
	const mapButtonControl = ( name ) => ( {
		...BLOCK_ALIGNMENTS_CONTROLS[ name ],
		isActive: value === name,
		onClick: applyOrUnset( name ),
	} );

	const enabledControls = wideControlsEnabled && false ?
		controls :
		controls.filter( ( control ) => WIDE_CONTROLS.indexOf( control ) === -1 );

	const activeAlignmentControl = wideControlsEnabled ? BLOCK_ALIGNMENTS_CONTROLS[ value ] : null;
	const defaultAlignmentControl = BLOCK_ALIGNMENTS_CONTROLS[ DEFAULT_CONTROL ];

	// Map buttons control.
	// it can get the unidimensional shape: [ 'left', 'center', 'right' ]
	// or 2-dimensional array if it desires the controls to be grouped:
	// [ [ 'left', 'center', 'right' ], [ 'wide' ] ]
	const toolbarControls = enabledControls.map( ( controlNames ) => (
		Array.isArray( controlNames ) ? controlNames.map( mapButtonControl ) : mapButtonControl( controlNames )
	) );

	return (
		<Toolbar
			isCollapsed={ isCollapsed }
			icon={ activeAlignmentControl ? activeAlignmentControl.icon : defaultAlignmentControl.icon }
			label={ __( 'Change alignment' ) }
			controls={ toolbarControls }
		/>
	);
}

export default compose(
	withBlockEditContext( ( { clientId } ) => {
		return {
			clientId,
		};
	} ),
	withSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		const settings = getSettings();
		return {
			wideControlsEnabled: settings.alignWide,
		};
	} ),
)( BlockAlignmentToolbar );
