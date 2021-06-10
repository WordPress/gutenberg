/**
 * External dependencies
 */
import { cx } from 'emotion';
// eslint-disable-next-line no-restricted-imports
import { Radio } from 'reakit';

/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	ButtonContentView,
	ButtonView,
	LabelPlaceholderView,
	LabelView,
	SeparatorView,
} from './styles';
// eslint-disable-next-line no-duplicate-imports
import * as styles from './styles';
import type { SegmentedControlButtonProps } from './types';

function SegmentedControlButton( allProps: SegmentedControlButtonProps ) {
	const {
		className,
		forwardedRef,
		isBlock = false,
		label,
		showSeparator,
		value,
		...props
	} = allProps;
	const isActive = props.state === value;
	const labelViewClasses = cx( isBlock && styles.labelBlock );
	const classes = cx( isActive && styles.buttonActive, className );
	return (
		<LabelView className={ labelViewClasses } data-active={ isActive }>
			<Radio
				{ ...props }
				as={ ButtonView }
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
			<SegmentedControlSeparator isActive={ ! showSeparator } />
		</LabelView>
	);
}

const SegmentedControlSeparator = memo( ( { isActive: boolean } ) => {
	const classes = cx( isActive && styles.separatorActive );
	return <SeparatorView aria-hidden className={ classes } />;
} );

export default memo( SegmentedControlButton );
