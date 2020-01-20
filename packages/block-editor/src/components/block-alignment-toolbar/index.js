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

const FullHeightIcon = <Icon icon={
	() => <SVG width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><Path d="M17 7V3h-4v2h2v2h2zM3 3v4h2V5h2V3H3zM5 13H3v4h4v-2H5v-2zM15 13h2v4h-4v-2h2v-2z"></Path></SVG> }
/>;

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

	fullHeight: {
		icon: FullHeightIcon,
		title: __( 'Full height' ),
	},
};

const DEFAULT_CONTROLS = [ 'left', 'center', 'right', 'wide', 'full', 'fullHeight' ];
const DEFAULT_CONTROL = 'center';
const WIDE_CONTROLS = [ 'wide', 'full', 'fullHeight' ];

export function BlockAlignmentToolbar( { value, onChange, controls = DEFAULT_CONTROLS, isCollapsed = true, wideControlsEnabled = false } ) {
	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	const enabledControls = wideControlsEnabled ?
		controls :
		controls.filter( ( control ) => WIDE_CONTROLS.indexOf( control ) === -1 );

	const activeAlignmentControl = BLOCK_ALIGNMENTS_CONTROLS[ value ];
	const defaultAlignmentControl = BLOCK_ALIGNMENTS_CONTROLS[ DEFAULT_CONTROL ];

	return (
		<Toolbar
			isCollapsed={ isCollapsed }
			icon={ activeAlignmentControl ? activeAlignmentControl.icon : defaultAlignmentControl.icon }
			label={ __( 'Change alignment' ) }
			controls={
				enabledControls.map( ( control ) => {
					return {
						...BLOCK_ALIGNMENTS_CONTROLS[ control ],
						isActive: value === control,
						role: isCollapsed ? 'menuitemradio' : undefined,
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
	withSelect( ( select ) => {
		const { getSettings } = select( 'core/block-editor' );
		const settings = getSettings();
		return {
			wideControlsEnabled: settings.alignWide,
		};
	} ),
)( BlockAlignmentToolbar );
