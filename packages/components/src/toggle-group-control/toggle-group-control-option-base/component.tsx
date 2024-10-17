/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useLayoutEffect, useMemo, useRef } from '@wordpress/element';

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

	const buttonOnClick = () => {
		if ( isDeselectable && isPressed ) {
			toggleGroupControlContext.setValue( undefined );
		} else {
			toggleGroupControlContext.setValue( value );
		}
	};

	const commonProps = {
		...otherButtonProps,
		className: itemClasses,
		'data-value': value,
		ref: forwardedRef,
	};

	const labelRef = useRef< HTMLDivElement | null >( null );
	useLayoutEffect( () => {
		if ( isPressed && labelRef.current ) {
			toggleGroupControlContext.setSelectedElement( labelRef.current );
		}
	}, [ isPressed, toggleGroupControlContext ] );

	return (
		<LabelView ref={ labelRef } className={ labelViewClasses }>
			<WithToolTip
				showTooltip={ showTooltip }
				text={ otherButtonProps[ 'aria-label' ] }
			>
				{ isDeselectable ? (
					<button
						{ ...commonProps }
						disabled={ disabled }
						aria-pressed={ isPressed }
						type="button"
						onClick={ buttonOnClick }
					>
						<ButtonContentView>{ children }</ButtonContentView>
					</button>
				) : (
					<Ariakit.Radio
						disabled={ disabled }
						onFocusVisible={ () => {
							const selectedValueIsEmpty =
								toggleGroupControlContext.value === null ||
								toggleGroupControlContext.value === '';

							// Conditions ensure that the first visible focus to a radio group
							// without a selected option will not automatically select the option.
							if (
								! selectedValueIsEmpty ||
								toggleGroupControlContext.activeItemIsNotFirstItem?.()
							) {
								toggleGroupControlContext.setValue( value );
							}
						} }
						render={ <button type="button" { ...commonProps } /> }
						value={ value }
					>
						<ButtonContentView>{ children }</ButtonContentView>
					</Ariakit.Radio>
				) }
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
