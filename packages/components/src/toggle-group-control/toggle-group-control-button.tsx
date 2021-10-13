/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { Radio } from 'reakit';

/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from './styles';
import type { ToggleGroupControlButtonProps } from './types';
import { useCx } from '../utils/hooks';

const { ButtonContentView, LabelPlaceholderView, LabelView } = styles;

function ToggleGroupControlButton( {
	className,
	forwardedRef,
	isBlock = false,
	label,
	value,
	...props
}: ToggleGroupControlButtonProps ) {
	const isActive = props.state === value;
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
				{ ...props }
				as="button"
				aria-label={ props[ 'aria-label' ] ?? label }
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

export default memo( ToggleGroupControlButton );
