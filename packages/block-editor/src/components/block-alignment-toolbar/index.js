/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Toolbar } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import {
	positionCenter,
	positionLeft,
	positionRight,
	stretchFullWidth,
	stretchWide,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { withBlockEditContext } from '../block-edit/context';

const BLOCK_ALIGNMENTS_CONTROLS = {
	left: {
		icon: positionLeft,
		title: __( 'Align left' ),
	},
	center: {
		icon: positionCenter,
		title: __( 'Align center' ),
	},
	right: {
		icon: positionRight,
		title: __( 'Align right' ),
	},
	wide: {
		icon: stretchWide,
		title: __( 'Wide width' ),
	},
	full: {
		icon: stretchFullWidth,
		title: __( 'Full width' ),
	},
};

const DEFAULT_CONTROLS = [ 'left', 'center', 'right', 'wide', 'full' ];
const DEFAULT_CONTROL = 'center';
const WIDE_CONTROLS = [ 'wide', 'full' ];

export function BlockAlignmentToolbar( {
	value,
	onChange,
	controls = DEFAULT_CONTROLS,
	isCollapsed = true,
	wideControlsEnabled = false,
} ) {
	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	const enabledControls = wideControlsEnabled
		? controls
		: controls.filter(
				( control ) => WIDE_CONTROLS.indexOf( control ) === -1
		  );

	const activeAlignmentControl = BLOCK_ALIGNMENTS_CONTROLS[ value ];
	const defaultAlignmentControl =
		BLOCK_ALIGNMENTS_CONTROLS[ DEFAULT_CONTROL ];

	return (
		<Toolbar
			isCollapsed={ isCollapsed }
			icon={
				activeAlignmentControl
					? activeAlignmentControl.icon
					: defaultAlignmentControl.icon
			}
			label={ __( 'Change alignment' ) }
			controls={ enabledControls.map( ( control ) => {
				return {
					...BLOCK_ALIGNMENTS_CONTROLS[ control ],
					isActive: value === control,
					role: isCollapsed ? 'menuitemradio' : undefined,
					onClick: applyOrUnset( control ),
				};
			} ) }
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
	} )
)( BlockAlignmentToolbar );
