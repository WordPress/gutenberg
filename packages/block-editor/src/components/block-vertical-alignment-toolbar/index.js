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
import { withBlockEditContext } from '../block-edit/context';
import { alignTop, alignCenter, alignBottom } from './icons';

const BLOCK_ALIGNMENTS_CONTROLS = {
	top: {
		icon: alignTop,
		title: _x( 'Vertically Align Top', 'Block vertical alignment setting' ),
	},
	center: {
		icon: alignCenter,
		title: _x( 'Vertically Align Middle', 'Block vertical alignment setting' ),
	},
	bottom: {
		icon: alignBottom,
		title: _x( 'Vertically Align Bottom', 'Block vertical alignment setting' ),
	},
};

const DEFAULT_CONTROLS = [ 'top', 'center', 'bottom' ];
const DEFAULT_CONTROL = 'top';

export function BlockVerticalAlignmentToolbar( { isCollapsed, value, onChange, controls = DEFAULT_CONTROLS } ) {
	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	const activeAlignment = BLOCK_ALIGNMENTS_CONTROLS[ value ];
	const defaultAlignmentControl = BLOCK_ALIGNMENTS_CONTROLS[ DEFAULT_CONTROL ];

	return (
		<Toolbar
			isCollapsed={ isCollapsed }
			icon={ activeAlignment ? activeAlignment.icon : defaultAlignmentControl.icon }
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

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/block-vertical-alignment-toolbar/README.md
 */
export default compose(
	withBlockEditContext( ( { clientId } ) => {
		return {
			clientId,
		};
	} ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withSelect( ( select, { clientId, isLargeViewport, isCollapsed } ) => {
		const { getBlockRootClientId, getSettings } = select( 'core/block-editor' );
		return {
			isCollapsed: isCollapsed || ! isLargeViewport || (
				! getSettings().hasFixedToolbar &&
				getBlockRootClientId( clientId )
			),
		};
	} ),
)( BlockVerticalAlignmentToolbar );
