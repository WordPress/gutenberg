/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import clsx from 'clsx';

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
import { useOnValueUpdate } from '../../utils/hooks/use-on-value-update';

function UnconnectedToggleGroupControl(
	props: WordPressComponentProps< ToggleGroupControlProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		__nextHasNoMarginBottom = false,
		__next40pxDefaultSize = false,
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

	const [ activeElement, setActiveElement ] = useState< HTMLElement >();
	if ( activeElement && ! value ) {
		setActiveElement( undefined );
	}
	const indicatorPosition = useTrackElementOffsetRect( activeElement );

	const [ animationEnabled, setAnimationEnabled ] = useState( false );
	useOnValueUpdate( indicatorPosition.element, ( { previousValue } ) => {
		// Only enable the animation when moving from one element to another.
		if ( indicatorPosition.element && previousValue ) {
			setAnimationEnabled( true );
		}
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
				setActiveElement={ setActiveElement }
				className={ clsx(
					animationEnabled && 'is-animation-enabled',
					classes
				) }
				style={ {
					'--indicator-left': indicatorPosition.left,
					'--indicator-width': indicatorPosition.width,
					'--indicator-height': indicatorPosition.height,
					...otherProps.style,
				} }
				onTransitionEnd={ ( event ) => {
					if ( event.pseudoElement === '::before' ) {
						setAnimationEnabled( false );
					}
				} }
				isAdaptiveWidth={ isAdaptiveWidth }
				label={ label }
				onChange={ onChange }
				ref={ forwardedRef }
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
