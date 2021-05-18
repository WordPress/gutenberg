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
import * as styles from './styles';
import { CONFIG, COLORS } from '../utils';

const {
	ButtonContentView,
	ButtonView,
	LabelPlaceholderView,
	LabelView,
	SeparatorView,
} = styles;

function SegmentedControlButton( {
	className,
	forwardedRef,
	isBlock = false,
	label,
	showSeparator,
	value,
	...props
} ) {
	const isActive = props.state === value;

	const labelViewClasses = cx( isBlock && styles.labelBlock );
	const classes = cx( isActive && styles.buttonActive, className );

	return (
		<LabelView
			className={ labelViewClasses }
			data-active={ isActive }
			{ ...ui.$( 'SegmentedControlButtonLabel' ) }
		>
			<Radio
				{ ...props }
				as={ ButtonView }
				className={ classes }
				data-value={ value }
				ref={ forwardedRef }
				value={ value }
			>
				<ButtonContentView
					{ ...ui.$( 'SegmentedControlButtonContent' ) }
				>
					{ label }
				</ButtonContentView>
				<LabelPlaceholderView
					aria-hidden
					{ ...ui.$( 'SegmentedControlButtonContentPlaceholder' ) }
				>
					{ label }
				</LabelPlaceholderView>
			</Radio>
			<SegmentedControlSeparator isActive={ ! showSeparator } />
		</LabelView>
	);
}

const SegmentedControlSeparator = memo( ( { isActive } ) => {
	const classes = cx( isActive && styles.separatorActive );

	return (
		<SeparatorView
			aria-hidden
			className={ classes }
			{ ...ui.$( 'SegmentedControlButtonSeparator' ) }
		/>
	);
} );

export default memo( SegmentedControlButton );
