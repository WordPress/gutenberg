/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { Toolbar } from '@wordpress/components';
import { withViewportMatch } from '@wordpress/viewport';
import { withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { valignTop, valignCenter, valignBottom } from './icons';

/**
 * Internal dependencies
 */
import { withBlockEditContext } from '../block-edit/context';

const BLOCK_ALIGNMENTS_CONTROLS = {
	top: {
		_id: 'top',
		icon: valignTop,
		title: _x( 'Vertically Align Top', 'Block vertical alignment setting' ),
	},
	center: {
		_id: 'center',
		icon: valignCenter,
		title: _x( 'Verticaly Align Middle', 'Block vertical alignment setting' ),
	},
	bottom: {
		_id: 'bottom',
		icon: valignBottom,
		title: _x( 'Verticaly Align Bottom', 'Block vertical alignment setting' ),
	},
};

const DEFAULT_CONTROLS = [ 'top', 'center', 'bottom' ];
const DEFAULT_CONTROL = 'top';

export function BlockVerticalAlignmentToolbar( { isCollapsed, value, onChange, controls = DEFAULT_CONTROLS } ) {
	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	const activeAlignment = BLOCK_ALIGNMENTS_CONTROLS[ value ];

	return (
		<Toolbar
			isCollapsed={ isCollapsed }
			icon={ activeAlignment ? activeAlignment.icon : BLOCK_ALIGNMENTS_CONTROLS[ DEFAULT_CONTROL ].icon }
			label={ _x( 'Change Alignment', 'Block vertical alignment setting label' ) }
			controls={
				controls.map( ( control ) => {
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
	withSelect( ( select, { clientId, isLargeViewport, isCollapsed } ) => {
		const { getBlockRootClientId, getEditorSettings } = select( 'core/editor' );
		return {
			isCollapsed: isCollapsed || ! isLargeViewport || (
				! getEditorSettings().hasFixedToolbar &&
				getBlockRootClientId( clientId )
			),
		};
	} ),
)( BlockVerticalAlignmentToolbar );
