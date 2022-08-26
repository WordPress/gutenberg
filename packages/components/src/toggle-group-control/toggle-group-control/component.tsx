/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { RadioGroup, useRadioState } from 'reakit';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef, useMemo } from '@wordpress/element';
import {
	useMergeRefs,
	useInstanceId,
	usePrevious,
	useResizeObserver,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	WordPressComponentProps,
} from '../../ui/context';
import { useUpdateEffect, useCx } from '../../utils/hooks';
import { View } from '../../view';
import BaseControl from '../../base-control';
import type { ToggleGroupControlProps } from '../types';
import ToggleGroupControlBackdrop from './toggle-group-control-backdrop';
import ToggleGroupControlContext from '../context';
import { VisualLabelWrapper } from './styles';
import * as styles from './styles';

const noop = () => {};

function UnconnectedToggleGroupControl(
	props: WordPressComponentProps< ToggleGroupControlProps, 'input', false >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		__nextHasNoMarginBottom = false,
		className,
		isAdaptiveWidth = false,
		isBlock = false,
		__experimentalIsIconGroup = false,
		label,
		hideLabelFromVision = false,
		help,
		onChange = noop,
		size = 'default',
		value,
		children,
		...otherProps
	} = useContextSystem( props, 'ToggleGroupControl' );
	const cx = useCx();
	const containerRef = useRef();
	const [ resizeListener, sizes ] = useResizeObserver();
	const baseId = useInstanceId(
		ToggleGroupControl,
		'toggle-group-control'
	).toString();
	const radio = useRadioState( {
		baseId,
		state: value,
	} );
	const previousValue = usePrevious( value );

	// Propagate radio.state change.
	useUpdateEffect( () => {
		// Avoid calling onChange if radio state changed
		// from incoming value.
		if ( previousValue !== radio.state ) {
			onChange( radio.state );
		}
	}, [ radio.state ] );

	// Sync incoming value with radio.state.
	useUpdateEffect( () => {
		if ( value !== radio.state ) {
			radio.setState( value );
		}
	}, [ value ] );

	const classes = useMemo(
		() =>
			cx(
				styles.ToggleGroupControl( { size } ),
				! __experimentalIsIconGroup && styles.border,
				isBlock && styles.block,
				className
			),
		[ className, cx, isBlock, __experimentalIsIconGroup, size ]
	);
	return (
		<BaseControl
			help={ help }
			__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
		>
			<ToggleGroupControlContext.Provider
				value={ { ...radio, isBlock: ! isAdaptiveWidth, size } }
			>
				{ ! hideLabelFromVision && (
					<VisualLabelWrapper>
						<BaseControl.VisualLabel>
							{ label }
						</BaseControl.VisualLabel>
					</VisualLabelWrapper>
				) }
				<RadioGroup
					{ ...radio }
					aria-label={ label }
					as={ View }
					className={ classes }
					{ ...otherProps }
					ref={ useMergeRefs( [ containerRef, forwardedRef ] ) }
				>
					{ resizeListener }
					<ToggleGroupControlBackdrop
						{ ...radio }
						containerRef={ containerRef }
						containerWidth={ sizes.width }
						isAdaptiveWidth={ isAdaptiveWidth }
					/>
					{ children }
				</RadioGroup>
			</ToggleGroupControlContext.Provider>
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
