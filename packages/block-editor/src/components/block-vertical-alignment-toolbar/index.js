/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { Toolbar } from '@wordpress/components';

/**
 * Internal dependencies
 */
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

export function BlockVerticalAlignmentToolbar( { value, onChange, controls = DEFAULT_CONTROLS, isCollapsed = true } ) {
	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	const activeAlignment = BLOCK_ALIGNMENTS_CONTROLS[ value ];
	const defaultAlignmentControl = BLOCK_ALIGNMENTS_CONTROLS[ DEFAULT_CONTROL ];

	return (
		<Toolbar
			isCollapsed={ isCollapsed }
			icon={ activeAlignment ? activeAlignment.icon : defaultAlignmentControl.icon }
			label={ _x( 'Change vertical alignment', 'Block vertical alignment setting label' ) }
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
export default BlockVerticalAlignmentToolbar;
