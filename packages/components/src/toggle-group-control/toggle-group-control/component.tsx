/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { LayoutGroup } from 'framer-motion';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../ui/context';
import { contextConnect, useContextSystem } from '../../ui/context';
import { useCx } from '../../utils/hooks';
import BaseControl from '../../base-control';
import type { ToggleGroupControlProps } from '../types';
import { VisualLabelWrapper } from './styles';
import * as styles from './styles';
import { ToggleGroupControlAsRadioGroup } from './as-radio-group';
import { ToggleGroupControlAsButtonGroup } from './as-button-group';

function UnconnectedToggleGroupControl(
	props: WordPressComponentProps< ToggleGroupControlProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		__nextHasNoMarginBottom = false,
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

	const baseId = useInstanceId( ToggleGroupControl, 'toggle-group-control' );

	const cx = useCx();

	const classes = useMemo(
		() =>
			cx(
				styles.toggleGroupControl( { isBlock, isDeselectable, size } ),
				isBlock && styles.block,
				className
			),
		[ className, cx, isBlock, isDeselectable, size ]
	);

	const MainControl = isDeselectable
		? ToggleGroupControlAsButtonGroup
		: ToggleGroupControlAsRadioGroup;

	return (
		<BaseControl
			help={ help }
			__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
		>
			{ ! hideLabelFromVision && (
				<VisualLabelWrapper>
					<BaseControl.VisualLabel>{ label }</BaseControl.VisualLabel>
				</VisualLabelWrapper>
			) }
			<MainControl
				{ ...otherProps }
				className={ classes }
				isAdaptiveWidth={ isAdaptiveWidth }
				label={ label }
				onChange={ onChange }
				ref={ forwardedRef }
				size={ size }
				value={ value }
			>
				<LayoutGroup id={ baseId }>{ children }</LayoutGroup>
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
 *     <ToggleGroupControl label="my label" value="vertical" isBlock>
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
