/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { ToolbarGroup, ToolbarDropdownMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	alignTop,
	alignCenter,
	alignBottom,
	alignStretch,
	spaceBetween,
} from './icons';

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
	stretch: {
		icon: alignStretch,
		title: _x( 'Stretch to fill', 'Block vertical alignment setting' ),
	},
	'space-between': {
		icon: spaceBetween,
		title: _x( 'Space between', 'Block vertical alignment setting' ),
	},
};

const DEFAULT_CONTROLS = [ 'top', 'center', 'bottom' ];
const DEFAULT_CONTROL = 'top';

function BlockVerticalAlignmentUI( {
	value,
	onChange,
	controls = DEFAULT_CONTROLS,
	isCollapsed = true,
	isToolbar,
} ) {
	function applyOrUnset( align ) {
		return () => onChange( value === align ? undefined : align );
	}

	const activeAlignment = BLOCK_ALIGNMENTS_CONTROLS[ value ];
	const defaultAlignmentControl =
		BLOCK_ALIGNMENTS_CONTROLS[ DEFAULT_CONTROL ];

	const UIComponent = isToolbar ? ToolbarGroup : ToolbarDropdownMenu;
	const extraProps = isToolbar
		? { isCollapsed }
		: { popoverProps: { variant: 'toolbar' } };

	return (
		<UIComponent
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
			{ ...extraProps }
		/>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-vertical-alignment-toolbar/README.md
 */
export default BlockVerticalAlignmentUI;
