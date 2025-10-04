/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { contextConnect, useContextSystem } from '../../context';
import { useCx } from '../../utils/hooks';
import BaseControl from '../../base-control';
import type { ToggleGroupControlProps } from '../types';
import { VisualLabelWrapper } from './styles';
import * as styles from './styles';
import { ToggleGroupControlAsRadioGroup } from './as-radio-group';
import { ToggleGroupControlAsButtonGroup } from './as-button-group';
import { useTrackElementOffsetRect } from '../../utils/element-rect';
import { useMergeRefs } from '@wordpress/compose';
import { useAnimatedOffsetRect } from '../../utils/hooks/use-animated-offset-rect';
import { maybeWarnDeprecated36pxSize } from '../../utils/deprecated-36px-size';

function UnconnectedToggleGroupControl(
	props: WordPressComponentProps< ToggleGroupControlProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		__nextHasNoMarginBottom = false,
		__next40pxDefaultSize = false,
		__shouldNotWarnDeprecated36pxSize,
		className,
		isAdaptiveWidth = false,
		isBlock = false,
		isDeselectable = false,
		label,
		hideLabelFromVision = false,
		help,
		onChange,
		size = 'default',
		value,
		children,
		...otherProps
	} = useContextSystem( props, 'ToggleGroupControl' );

	const normalizedSize =
		__next40pxDefaultSize && size === 'default' ? '__unstable-large' : size;

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
		roundRect: true,
	} );

	const cx = useCx();

	const classes = useMemo(
		() =>
			cx(
				styles.toggleGroupControl( {
					isBlock,
					isDeselectable,
					size: normalizedSize,
				} ),
				isBlock && styles.block,
				className
			),
		[ className, cx, isBlock, isDeselectable, normalizedSize ]
	);

	const MainControl = isDeselectable
		? ToggleGroupControlAsButtonGroup
		: ToggleGroupControlAsRadioGroup;

	maybeWarnDeprecated36pxSize( {
		componentName: 'ToggleGroupControl',
		size,
		__next40pxDefaultSize,
		__shouldNotWarnDeprecated36pxSize,
	} );

	return (
		<BaseControl
			help={ help }
			__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
			__associatedWPComponentName="ToggleGroupControl"
		>
			{ ! hideLabelFromVision && (
				<VisualLabelWrapper>
					<BaseControl.VisualLabel>{ label }</BaseControl.VisualLabel>
				</VisualLabelWrapper>
			) }
			<MainControl
				{ ...otherProps }
				setSelectedElement={ setSelectedElement }
				className={ classes }
				isAdaptiveWidth={ isAdaptiveWidth }
				label={ label }
				onChange={ onChange }
				ref={ refs }
				size={ normalizedSize }
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
 *       __nextHasNoMarginBottom
 *       __next40pxDefaultSize
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
