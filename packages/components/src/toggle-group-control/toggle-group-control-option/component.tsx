/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Radio } from 'reakit';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	WordPressComponentProps,
} from '../../ui/context';
import type { ToggleGroupControlOptionProps } from '../types';
import { useToggleGroupControlContext } from '../context';
import * as styles from './styles';
import { useCx } from '../../utils/hooks';

const { ButtonContentView, LabelPlaceholderView, LabelView } = styles;

function ToggleGroupControlOption(
	props: WordPressComponentProps< ToggleGroupControlOptionProps, 'button' >,
	forwardedRef: Ref< any >
) {
	const toggleGroupControlContext = useToggleGroupControlContext();
	const id = useInstanceId(
		ToggleGroupControlOption,
		toggleGroupControlContext.baseId || 'toggle-group-control-option'
	) as string;
	const buttonProps = useContextSystem(
		{ ...props, id },
		'ToggleGroupControlOption'
	);

	const { className, isBlock = false, label, value, ...radioProps } = {
		...toggleGroupControlContext,
		...buttonProps,
	};

	const isActive = radioProps.state === value;
	const cx = useCx();
	const labelViewClasses = cx( isBlock && styles.labelBlock );
	const classes = cx(
		styles.buttonView,
		className,
		isActive && styles.buttonActive
	);

	return (
		<LabelView className={ labelViewClasses } data-active={ isActive }>
			<Radio
				{ ...radioProps }
				as="button"
				aria-label={ radioProps[ 'aria-label' ] ?? label }
				className={ classes }
				data-value={ value }
				ref={ forwardedRef }
				value={ value }
			>
				<ButtonContentView>{ label }</ButtonContentView>
				<LabelPlaceholderView aria-hidden>
					{ label }
				</LabelPlaceholderView>
			</Radio>
		</LabelView>
	);
}

/**
 * `ToggleGroupControlOption` is a form component and is meant to be used as a
 * child of `ToggleGroupControl`.
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
const ConnectedToggleGroupControlOption = contextConnect(
	ToggleGroupControlOption,
	'ToggleGroupControlOption'
);

export default ConnectedToggleGroupControlOption;
