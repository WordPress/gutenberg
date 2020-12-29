/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { ToolbarGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { alignTop, alignCenter, alignBottom } from './icons';

const BLOCK_ALIGNMENTS_CONTROLS = {
	top: {
		icon: alignTop,
		title: _x( 'Align top', 'Block vertical alignment setting' ),
	},
	center: {
		icon: alignCenter,
		title: _x( 'Align middle', 'Block vertical alignment setting' ),
	},
	bottom: {
		icon: alignBottom,
		title: _x( 'Align bottom', 'Block vertical alignment setting' ),
	},
};

const DEFAULT_CONTROLS = [ 'top', 'center', 'bottom' ];
const DEFAULT_CONTROL = 'top';

const POPOVER_PROPS = {
	isAlternate: true,
};

export function BlockVerticalAlignmentToolbar( {
	value,
	onChange,
	controls = DEFAULT_CONTROLS,
	isCollapsed = true,
} ) {
	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	const activeAlignment = BLOCK_ALIGNMENTS_CONTROLS[ value ];
	const defaultAlignmentControl =
		BLOCK_ALIGNMENTS_CONTROLS[ DEFAULT_CONTROL ];

	return (
		<ToolbarGroup
			popoverProps={ POPOVER_PROPS }
			isCollapsed={ isCollapsed }
			icon={
				activeAlignment
					? activeAlignment.icon
					: defaultAlignmentControl.icon
			}
			label={ _x(
				'Change vertical alignment',
				'Block vertical alignment setting label'
			) }
			controls={ controls.map( ( control ) => {
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

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/block-vertical-alignment-toolbar/README.md
 */
export default BlockVerticalAlignmentToolbar;
