/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import * as Ariakit from '@ariakit/react';
import { motion } from 'framer-motion';

/**
 * WordPress dependencies
 */
import { useReducedMotion, useInstanceId } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { contextConnect, useContextSystem } from '../../context';
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

const handleDisabledMouseEvent = (
	event: React.MouseEvent,
	disabled?: boolean
) => {
	if ( disabled ) {
		event.stopPropagation();
		event.preventDefault();
	}
};

const WithToolTip = ( { showTooltip, text, children }: WithToolTipProps ) => {
	if ( showTooltip && text ) {
		return (
			<Tooltip text={ text } placement="top">
				{ children }
			</Tooltip>
		);
	}
	return <>{ children }</>;
};

function ToggleGroupControlOptionBase(
	props: Omit<
		WordPressComponentProps<
			ToggleGroupControlOptionBaseProps,
			'button',
			false
		>,
		// the element's id is generated internally
		| 'id'
		// due to how the component works, only the `disabled` prop should be used
		| 'aria-disabled'
	>,
	forwardedRef: ForwardedRef< any >
) {
	const shouldReduceMotion = useReducedMotion();
	const toggleGroupControlContext = useToggleGroupControlContext();

	const id = useInstanceId(
		ToggleGroupControlOptionBase,
		toggleGroupControlContext.baseId || 'toggle-group-control-option-base'
	);

	const buttonProps = useContextSystem(
		{ ...props, id },
		'ToggleGroupControlOptionBase'
	);

	const {
		isBlock = false,
		isDeselectable = false,
		size = 'default',
	} = toggleGroupControlContext;

	const {
		className,
		isIcon = false,
		value,
		children,
		showTooltip = false,
		onFocus: onFocusProp,
		disabled,
		...otherButtonProps
	} = buttonProps;

	const isPressed = toggleGroupControlContext.value === value;
	const cx = useCx();
	const labelViewClasses = useMemo(
		() => cx( isBlock && styles.labelBlock ),
		[ cx, isBlock ]
	);
	const itemClasses = useMemo(
		() =>
			cx(
				styles.buttonView( {
					isDeselectable,
					isIcon,
					isPressed,
					size,
				} ),
				className
			),
		[ cx, isDeselectable, isIcon, isPressed, size, className ]
	);
	const backdropClasses = useMemo( () => cx( styles.backdropView ), [ cx ] );

	const commonProps = {
		...otherButtonProps,
		className: itemClasses,
		'data-value': value,
		ref: forwardedRef,
	};

	const buttonOnMouseDown: React.MouseEventHandler< HTMLButtonElement > = (
		event
	) => {
		handleDisabledMouseEvent( event, disabled );

		commonProps.onMouseDown?.( event );
	};

	const buttonOnClick: React.MouseEventHandler< HTMLButtonElement > = (
		event
	) => {
		handleDisabledMouseEvent( event, disabled );

		if ( ! disabled ) {
			if ( isDeselectable && isPressed ) {
				toggleGroupControlContext.setValue( undefined );
			} else {
				toggleGroupControlContext.setValue( value );
			}
		}

		commonProps.onClick?.( event );
	};

	return (
		<LabelView className={ labelViewClasses }>
			<WithToolTip
				showTooltip={ showTooltip }
				text={ otherButtonProps[ 'aria-label' ] }
			>
				{ isDeselectable ? (
					<button
						{ ...commonProps }
						aria-disabled={ disabled }
						onFocus={ onFocusProp }
						aria-pressed={ isPressed }
						type="button"
						onClick={ buttonOnClick }
						onMouseDown={ buttonOnMouseDown }
					>
						<ButtonContentView>{ children }</ButtonContentView>
					</button>
				) : (
					<Ariakit.Radio
						accessibleWhenDisabled
						disabled={ disabled }
						render={
							<button
								type="button"
								{ ...commonProps }
								onFocus={ ( event ) => {
									onFocusProp?.( event );
									if ( event.defaultPrevented ) {
										return;
									}
									if ( ! disabled ) {
										toggleGroupControlContext.setValue(
											value
										);
									}
								} }
							/>
						}
						value={ value }
					>
						<ButtonContentView>{ children }</ButtonContentView>
					</Ariakit.Radio>
				) }
			</WithToolTip>
			{ /* Animated backdrop using framer motion's shared layout animation */ }
			{ isPressed ? (
				<motion.div layout layoutRoot>
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
				</motion.div>
			) : null }
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
