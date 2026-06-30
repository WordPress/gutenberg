/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { contextConnect, useContextSystem } from '../../context';
import { useCx } from '../../utils/hooks';
import BaseControl, { useBaseControlProps } from '../../base-control';
import type { ToggleGroupControlProps } from '../types';
import * as styles from './styles';
import { ToggleGroupControlAsRadioGroup } from './as-radio-group';
import { ToggleGroupControlAsButtonGroup } from './as-button-group';
import { useTrackElementOffsetRect } from '../../utils/element-rect';
import { useAnimatedOffsetRect } from '../../utils/hooks/use-animated-offset-rect';

function UnconnectedToggleGroupControl(
	props: WordPressComponentProps< ToggleGroupControlProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		// Prevent passing legacy props to internal component.
		__nextHasNoMarginBottom: _,
		size: _size,
		__next40pxDefaultSize: _next40pxDefaultSize,
		__shouldNotWarnDeprecated36pxSize: _shouldNotWarnDeprecated36pxSize,
		className,
		isAdaptiveWidth = false,
		isBlock = false,
		isDeselectable = false,
		id,
		label,
		hideLabelFromVision = false,
		help,
		onChange,
		value,
		children,
		...otherProps
	} = useContextSystem( props, 'ToggleGroupControl' );

	const { baseControlProps, controlProps } = useBaseControlProps( {
		id,
		help,
		label,
		hideLabelFromVision,
	} );

	const [ selectedElement, setSelectedElement ] = useState< HTMLElement >();
	const [ controlElement, setControlElement ] = useState< HTMLElement >();
	const refs = useMergeRefs( [ setControlElement, forwardedRef ] );
	const selectedRect = useTrackElementOffsetRect(
		value !== null && value !== undefined ? selectedElement : undefined
	);
	useAnimatedOffsetRect( controlElement, selectedRect, {
		prefix: 'selected',
		dataAttribute: 'indicator-animated',
		transitionEndFilter: ( event ) => event.pseudoElement === '::before',
		roundRect: false,
	} );

	const cx = useCx();

	const classes = useMemo(
		() =>
			cx(
				styles.toggleGroupControl( {
					isBlock,
					isDeselectable,
				} ),
				isBlock && styles.block,
				className
			),
		[ className, cx, isBlock, isDeselectable ]
	);

	const MainControl = isDeselectable
		? ToggleGroupControlAsButtonGroup
		: ToggleGroupControlAsRadioGroup;

	return (
		<BaseControl { ...baseControlProps }>
			<MainControl
				{ ...otherProps }
				{ ...controlProps }
				setSelectedElement={ setSelectedElement }
				className={ classes }
				isAdaptiveWidth={ isAdaptiveWidth }
				// `label` is used for `aria-label` on the inner control.
				// This is separate from the visual label rendered by `BaseControl`.
				label={ label }
				onChange={ onChange }
				ref={ refs }
				value={ value }
			>
				{ children }
			</MainControl>
		</BaseControl>
	);
}

/**
 * `ToggleGroupControl` is a form component that lets users choose options
 * represented in horizontal segments. To render options for this control use
 * `ToggleGroupControlOption` component.
 *
 * This component is intended for selecting a single persistent value from a set of options,
 * similar to a how a radio button group would work. If you simply want a toggle to switch between views,
 * use a `TabPanel` instead.
 *
 * Only use this control when you know for sure the labels of items inside won't
 * wrap. For items with longer labels, you can consider a `SelectControl` or a
 * `CustomSelectControl` component instead.
 *
 * ```jsx
 * import {
 *   __experimentalToggleGroupControl as ToggleGroupControl,
 *   __experimentalToggleGroupControlOption as ToggleGroupControlOption,
 * } from '@wordpress/components';
 *
 * function Example() {
 *   return (
 *     <ToggleGroupControl
 *       label="my label"
 *       value="vertical"
 *       isBlock
 *     >
 *       <ToggleGroupControlOption value="horizontal" label="Horizontal" />
 *       <ToggleGroupControlOption value="vertical" label="Vertical" />
 *     </ToggleGroupControl>
 *   );
 * }
 * ```
 */
export const ToggleGroupControl = contextConnect(
	UnconnectedToggleGroupControl,
	'ToggleGroupControl'
);

export default ToggleGroupControl;
