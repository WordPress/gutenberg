/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BorderBoxControlVisualizer from '../border-box-control-visualizer';
import { BorderControl } from '../../border-control';
import { Grid } from '../../grid';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { useBorderBoxControlSplitControls } from './hook';

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
		value,
		__experimentalHasMultipleOrigins,
		__experimentalIsRenderedInSidebar,
		__next36pxDefaultSize,
		...otherProps
	} = useBorderBoxControlSplitControls( props );
	const containerRef = useRef();
	const mergedRef = useMergeRefs( [ containerRef, forwardedRef ] );
	const popoverProps = popoverPlacement
		? {
				placement: popoverPlacement,
				offset: popoverOffset,
				anchorRef: containerRef,
		  }
		: undefined;

	const sharedBorderControlProps = {
		colors,
		disableCustomColors,
		enableAlpha,
		enableStyle,
		isCompact: true,
		__experimentalHasMultipleOrigins,
		__experimentalIsRenderedInSidebar,
		__next36pxDefaultSize,
	};

	return (
		<Grid { ...otherProps } ref={ mergedRef } gap={ 4 }>
			<BorderBoxControlVisualizer
				value={ value }
				__next36pxDefaultSize={ __next36pxDefaultSize }
			/>
			<BorderControl
				className={ centeredClassName }
				hideLabelFromVision={ true }
				label={ __( 'Top border' ) }
				onChange={ ( newBorder ) => onChange( newBorder, 'top' ) }
				__unstablePopoverProps={ popoverProps }
				value={ value?.top }
				{ ...sharedBorderControlProps }
			/>
			<BorderControl
				hideLabelFromVision={ true }
				label={ __( 'Left border' ) }
				onChange={ ( newBorder ) => onChange( newBorder, 'left' ) }
				__unstablePopoverProps={ popoverProps }
				value={ value?.left }
				{ ...sharedBorderControlProps }
			/>
			<BorderControl
				className={ rightAlignedClassName }
				hideLabelFromVision={ true }
				label={ __( 'Right border' ) }
				onChange={ ( newBorder ) => onChange( newBorder, 'right' ) }
				__unstablePopoverProps={ popoverProps }
				value={ value?.right }
				{ ...sharedBorderControlProps }
			/>
			<BorderControl
				className={ centeredClassName }
				hideLabelFromVision={ true }
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
