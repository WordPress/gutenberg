/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Radio } from 'reakit';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

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
		isBlock = false,
		isDeselectable = false,
		size = 'default',
		...otherContextProps
	} = toggleGroupControlContext;
	const {
		className,
		isIcon = false,
		isMultiple = false,
		value,
		children,
		showTooltip = false,
		...otherButtonProps
	} = buttonProps;

	const isPressed =
		otherContextProps.state === value ||
		otherButtonProps[ 'aria-pressed' ] === true;
	const cx = useCx();
	const labelViewClasses = cx( isBlock && styles.labelBlock );
	const classes = cx(
		styles.buttonView( {
			isDeselectable,
			isIcon,
			isMultiple,
			isPressed,
			size,
		} ),
		className
	);

	const singleSelectButtonProps = {
		'aria-pressed': isPressed,
		onClick: () =>
			otherContextProps.setState( isPressed ? undefined : value ),
	};

	return (
		<LabelView className={ labelViewClasses }>
			<WithToolTip
				showTooltip={ showTooltip }
				text={ otherButtonProps[ 'aria-label' ] }
			>
				{ isDeselectable ? (
					<button
						{ ...otherButtonProps }
						{ ...( isMultiple ? {} : singleSelectButtonProps ) }
						type="button"
						className={ classes }
						data-value={ value }
						ref={ forwardedRef }
					>
						<ButtonContentView>{ children }</ButtonContentView>
					</button>
				) : (
					<Radio
						as="button"
						{ ...otherButtonProps }
						{ ...otherContextProps }
						className={ classes }
						data-value={ value }
						ref={ forwardedRef }
						value={ value }
					>
						<ButtonContentView>{ children }</ButtonContentView>
					</Radio>
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
