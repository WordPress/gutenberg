import type { ComponentProps, ComponentType } from 'react';
import { __, _x } from '@wordpress/i18n';
import { ToolbarGroup, ToolbarDropdownMenu } from '@wordpress/components';
import {
	justifyTop,
	justifyCenterVertical,
	justifyBottom,
	justifyStretchVertical,
	justifySpaceBetweenVertical,
} from '@wordpress/icons';
import type {
	BlockVerticalAlignment,
	BlockVerticalAlignmentUIProps,
} from './types';

const BLOCK_ALIGNMENTS_CONTROLS = {
	top: {
		icon: justifyTop,
		title: _x( 'Align top', 'Block vertical alignment setting' ),
	},
	center: {
		icon: justifyCenterVertical,
		title: _x( 'Align middle', 'Block vertical alignment setting' ),
	},
	bottom: {
		icon: justifyBottom,
		title: _x( 'Align bottom', 'Block vertical alignment setting' ),
	},
	stretch: {
		icon: justifyStretchVertical,
		title: _x( 'Stretch to fill', 'Block vertical alignment setting' ),
	},
	'space-between': {
		icon: justifySpaceBetweenVertical,
		title: _x( 'Space between', 'Block vertical alignment setting' ),
	},
};

const DEFAULT_CONTROLS: BlockVerticalAlignment[] = [
	'top',
	'center',
	'bottom',
];
const DEFAULT_CONTROL = 'top';

function BlockVerticalAlignmentUI( {
	value,
	onChange,
	controls = DEFAULT_CONTROLS,
	isCollapsed = true,
	isToolbar,
	label = __( 'Align content vertically' ),
}: BlockVerticalAlignmentUIProps ) {
	function applyOrUnset( align: BlockVerticalAlignment ) {
		return () => onChange( value === align ? undefined : align );
	}

	// An unset value looks up no control.
	const activeAlignment =
		BLOCK_ALIGNMENTS_CONTROLS[ value as BlockVerticalAlignment ];
	const defaultAlignmentControl =
		BLOCK_ALIGNMENTS_CONTROLS[ DEFAULT_CONTROL ];

	// Both take these props; `ToolbarGroup`'s types also require a `title`
	// for a collapsed group, which was never passed.
	const UIComponent = (
		isToolbar ? ToolbarGroup : ToolbarDropdownMenu
	) as ComponentType<
		ComponentProps< typeof ToolbarDropdownMenu > & { isCollapsed?: boolean }
	>;
	const extraProps = isToolbar ? { isCollapsed } : {};

	return (
		<UIComponent
			icon={
				activeAlignment
					? activeAlignment.icon
					: defaultAlignmentControl.icon
			}
			label={ label }
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
