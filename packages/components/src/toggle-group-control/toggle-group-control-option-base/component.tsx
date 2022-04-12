/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Radio } from 'reakit';
// eslint-disable-next-line no-restricted-imports
import { motion, useReducedMotion } from 'framer-motion';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	WordPressComponentProps,
} from '../../ui/context';
import type {
	ToggleGroupControlOptionBaseProps,
	WithToolTipProps,
} from '../types';
import { useToggleGroupControlContext } from '../context';
import * as styles from './styles';
import { useCx } from '../../utils/hooks';
import Tooltip from '../../tooltip';

const { ButtonContentView, LabelView } = styles;

const REDUCED_MOTION_TRANSITION_CONFIG = {
	duration: 0,
};

const LAYOUT_ID = 'toggle-group-backdrop-shared-layout-id';

const WithToolTip = ( { showTooltip, text, children }: WithToolTipProps ) => {
	if ( showTooltip && text ) {
		return (
			<Tooltip text={ text } position="top center">
				{ children }
			</Tooltip>
		);
	}
	return <>{ children }</>;
};

function ToggleGroupControlOptionBase(
	props: WordPressComponentProps<
		ToggleGroupControlOptionBaseProps,
		'button',
		false
	>,
	forwardedRef: ForwardedRef< any >
) {
	const shouldReduceMotion = useReducedMotion();
	const toggleGroupControlContext = useToggleGroupControlContext();
	const id = useInstanceId(
		ToggleGroupControlOptionBase,
		toggleGroupControlContext.baseId || 'toggle-group-control-option-base'
	) as string;
	const buttonProps = useContextSystem(
		{ ...props, id },
		'ToggleGroupControlOptionBase'
	);
	const {
		className,
		isBlock = false,
		isIcon = false,
		value,
		children,
		size = 'default',
		showTooltip = false,
		...radioProps
	} = {
		...toggleGroupControlContext,
		...buttonProps,
	};

	const isActive = radioProps.state === value;

	const cx = useCx();
	const labelViewClasses = useMemo(
		() => cx( isBlock && styles.labelBlock ),
		[ cx, isBlock ]
	);
	const radioClasses = useMemo(
		() =>
			cx(
				styles.buttonView,
				isIcon && styles.isIcon( { size } ),
				className,
				isActive && styles.buttonActive
			),
		[ cx, className, isActive, isIcon, size ]
	);
	const backdropClasses = useMemo( () => cx( styles.backdropView ), [ cx ] );

	return (
		<LabelView className={ labelViewClasses } data-active={ isActive }>
			<WithToolTip
				showTooltip={ showTooltip }
				text={ radioProps[ 'aria-label' ] }
			>
				<Radio
					{ ...radioProps }
					as="button"
					aria-label={ radioProps[ 'aria-label' ] }
					className={ radioClasses }
					data-value={ value }
					ref={ forwardedRef }
					value={ value }
				>
					<ButtonContentView>{ children }</ButtonContentView>
				</Radio>
				{ /* Animated backdrop using framer motion's shared layout animation */ }
				{ isActive ? (
					<motion.div
						className={ backdropClasses }
						transition={
							shouldReduceMotion
								? REDUCED_MOTION_TRANSITION_CONFIG
								: undefined
						}
						role="presentation"
						layoutId={ LAYOUT_ID }
					/>
				) : null }
			</WithToolTip>
		</LabelView>
	);
}

/**
 * `ToggleGroupControlOptionBase` is a form component and is meant to be used as an internal,
 * generic component for any children of `ToggleGroupControl`.
 *
 * @example
 * ```jsx
 * import {
 *   __experimentalToggleGroupControl as ToggleGroupControl,
 *   __experimentalToggleGroupControlOptionBase as ToggleGroupControlOptionBase,
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
const ConnectedToggleGroupControlOptionBase = contextConnect(
	ToggleGroupControlOptionBase,
	'ToggleGroupControlOptionBase'
);

export default ConnectedToggleGroupControlOptionBase;
