/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Toolbar, Icon, SVG, Path } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { withBlockEditContext } from '../block-edit/context';

const FullScreenIcon = <Icon icon={ () => <SVG width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><Path d="M17 7V3h-4v2h2v2h2zM3 3v4h2V5h2V3H3zM5 13H3v4h4v-2H5v-2zM15 13h2v4h-4v-2h2v-2z"></Path></SVG> } />;

export const BLOCK_ALIGNMENTS_CONTROLS = {
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
	fullScreen: {
		icon: FullScreenIcon,
		title: __( 'Full Screen' ),
	},
};

const DEFAULT_CONTROLS = [ 'left', 'center', 'right', 'wide', 'full', 'fullScreen' ];
const DEFAULT_CONTROL = 'center';
const WIDE_CONTROLS = [ 'wide', 'full', 'fullScreen' ];

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
		return () => onChange(
			value === align ? undefined : align,
			Object.keys( BLOCK_ALIGNMENTS_CONTROLS )
		);
	}

	/**
	 * returns a control object according on the given control name .
	 *
	 * @param {string}  name Control name
	 * @return {Object} Control object.
	 */
	const mapButtonControl = ( name ) => ( {
		...BLOCK_ALIGNMENTS_CONTROLS[ name ],
		isActive: value === name,
		onClick: applyOrUnset( name ),
	} );

	const enabledControls = wideControlsEnabled ?
		controls :
		controls.filter( ( control ) => WIDE_CONTROLS.indexOf( control ) === -1 );

	const activeAlignmentControl = wideControlsEnabled ? BLOCK_ALIGNMENTS_CONTROLS[ value ] : null;
	const defaultAlignmentControl = BLOCK_ALIGNMENTS_CONTROLS[ DEFAULT_CONTROL ];

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
