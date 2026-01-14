/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BorderBoxControlVisualizer from '../border-box-control-visualizer';
import { BorderControl } from '../../border-control';
import { Grid } from '../../grid';
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { useBorderBoxControlSplitControls } from './hook';

import type { BorderControlProps } from '../../border-control/types';
import type { SplitControlsProps } from '../types';

const BorderBoxControlSplitControls = (
	props: WordPressComponentProps< SplitControlsProps, 'div' >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const {
		centeredClassName,
		colors,
		disableCustomColors,
		enableAlpha,
		enableStyle,
		onChange,
		popoverPlacement,
		popoverOffset,
		rightAlignedClassName,
		size = 'default',
		value,
		__experimentalIsRenderedInSidebar,
		...otherProps
	} = useBorderBoxControlSplitControls( props );

	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState< Element | null >(
		null
	);

	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps: BorderControlProps[ '__unstablePopoverProps' ] =
		useMemo(
			() =>
				popoverPlacement
					? {
							placement: popoverPlacement,
							offset: popoverOffset,
							anchor: popoverAnchor,
							shift: true,
					  }
					: undefined,
			[ popoverPlacement, popoverOffset, popoverAnchor ]
		);

	const sharedBorderControlProps = {
		colors,
		disableCustomColors,
		enableAlpha,
		enableStyle,
		isCompact: true,
		__experimentalIsRenderedInSidebar,
		size,
		__shouldNotWarnDeprecated36pxSize: true,
	};

	const mergedRef = useMergeRefs( [ setPopoverAnchor, forwardedRef ] );

	return (
		<Grid { ...otherProps } ref={ mergedRef } gap={ 3 }>
			<BorderBoxControlVisualizer value={ value } size={ size } />
			<BorderControl
				className={ centeredClassName }
				hideLabelFromVision
				label={ __( 'Top border' ) }
				onChange={ ( newBorder ) => onChange( newBorder, 'top' ) }
				__unstablePopoverProps={ popoverProps }
				value={ value?.top }
				{ ...sharedBorderControlProps }
			/>
			<BorderControl
				hideLabelFromVision
				label={ __( 'Left border' ) }
				onChange={ ( newBorder ) => onChange( newBorder, 'left' ) }
				__unstablePopoverProps={ popoverProps }
				value={ value?.left }
				{ ...sharedBorderControlProps }
			/>
			<BorderControl
				className={ rightAlignedClassName }
				hideLabelFromVision
				label={ __( 'Right border' ) }
				onChange={ ( newBorder ) => onChange( newBorder, 'right' ) }
				__unstablePopoverProps={ popoverProps }
				value={ value?.right }
				{ ...sharedBorderControlProps }
			/>
			<BorderControl
				className={ centeredClassName }
				hideLabelFromVision
				label={ __( 'Bottom border' ) }
				onChange={ ( newBorder ) => onChange( newBorder, 'bottom' ) }
				__unstablePopoverProps={ popoverProps }
				value={ value?.bottom }
				{ ...sharedBorderControlProps }
			/>
		</Grid>
	);
};

const ConnectedBorderBoxControlSplitControls = contextConnect(
	BorderBoxControlSplitControls,
	'BorderBoxControlSplitControls'
);
export default ConnectedBorderBoxControlSplitControls;
