/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';
// eslint-disable-next-line no-restricted-imports
import { RadioGroup, useRadioState } from 'ariakit/radio';
import useResizeAware from 'react-resize-aware';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef, useMemo } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	WordPressComponentProps,
} from '../../ui/context';
import { useCx } from '../../utils/hooks';
import { View } from '../../view';
import BaseControl from '../../base-control';
import ToggleGroupControlBackdrop from './toggle-group-control-backdrop';
import type { ToggleGroupControlProps } from '../types';
import ToggleGroupControlContext from '../context';
import * as styles from './styles';

const noop = () => {};

function ToggleGroupControl(
	props: WordPressComponentProps< ToggleGroupControlProps, 'input' >,
	forwardedRef: Ref< any >
) {
	const {
		className,
		isAdaptiveWidth = false,
		isBlock = false,
		label,
		hideLabelFromVision = false,
		help,
		onChange = noop,
		children,
		...otherProps
	} = useContextSystem( props, 'ToggleGroupControl' );
	const cx = useCx();
	const containerRef = useRef();
	const [ resizeListener, sizes ] = useResizeAware();
	const value =
		'value' in otherProps && otherProps.value === undefined
			? null
			: otherProps.value;
	const radio = useRadioState( { value, setValue: onChange } );

	const classes = useMemo(
		() =>
			cx(
				styles.ToggleGroupControl,
				isBlock && styles.block,
				'medium',
				className
			),
		[ className, isBlock ]
	);

	return (
		<BaseControl help={ help }>
			<ToggleGroupControlContext.Provider
				value={ { state: radio, isBlock: ! isAdaptiveWidth } }
			>
				{ ! hideLabelFromVision && (
					<div>
						<BaseControl.VisualLabel>
							{ label }
						</BaseControl.VisualLabel>
					</div>
				) }
				<RadioGroup
					state={ radio }
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
 * Only use this control when you know for sure the labels of items inside won't
 * wrap. For items with longer labels, you can consider a `SelectControl` or a
 * `CustomSelectControl` component instead.
 *
 * @example
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
const ConnectedToggleGroupControl = contextConnect(
	ToggleGroupControl,
	'ToggleGroupControl'
);

export default ConnectedToggleGroupControl;
