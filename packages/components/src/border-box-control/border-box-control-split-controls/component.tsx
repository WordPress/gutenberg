/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BorderBoxControlVisualizer from '../border-box-control-visualizer';
import { BorderControl } from '../../border-control';
import { View } from '../../view';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { useBorderBoxControlSplitControls } from './hook';

import type { SplitControlsProps } from '../types';

const BorderBoxControlSplitControls = (
	props: WordPressComponentProps< SplitControlsProps, 'div' >,
	forwardedRef: React.Ref< any >
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
		<View { ...otherProps } ref={ forwardedRef }>
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
		</View>
	);
};

const ConnectedBorderBoxControlSplitControls = contextConnect(
	BorderBoxControlSplitControls,
	'BorderBoxControlSplitControls'
);
export default ConnectedBorderBoxControlSplitControls;
