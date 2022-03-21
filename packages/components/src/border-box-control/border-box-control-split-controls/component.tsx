/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

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
		value,
		__experimentalHasMultipleOrigins,
		__experimentalIsRenderedInSidebar,
		...otherProps
	} = useBorderBoxControlSplitControls( props );

	const sharedBorderControlProps = {
		colors,
		disableCustomColors,
		enableAlpha,
		enableStyle,
		isCompact: true,
		__experimentalHasMultipleOrigins,
		__experimentalIsRenderedInSidebar,
	};

	return (
		<Grid { ...otherProps } ref={ forwardedRef } gap={ 4 }>
			<BorderBoxControlVisualizer value={ value } />
			<BorderControl
				className={ centeredClassName }
				onChange={ ( newBorder ) => onChange( newBorder, 'top' ) }
				value={ value?.top }
				{ ...sharedBorderControlProps }
			/>
			<BorderControl
				onChange={ ( newBorder ) => onChange( newBorder, 'left' ) }
				value={ value?.left }
				{ ...sharedBorderControlProps }
			/>
			<BorderControl
				onChange={ ( newBorder ) => onChange( newBorder, 'right' ) }
				value={ value?.right }
				{ ...sharedBorderControlProps }
			/>
			<BorderControl
				className={ centeredClassName }
				onChange={ ( newBorder ) => onChange( newBorder, 'bottom' ) }
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
