/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { getClampedWidthBorderStyle } from '../utils';
import { useBorderBoxControlVisualizer } from './hook';

import type { VisualizerProps } from '../types';

const BorderBoxControlVisualizer = (
	props: WordPressComponentProps< VisualizerProps, 'div' >,
	forwardedRef: React.Ref< any >
) => {
	const { value, ...otherProps } = useBorderBoxControlVisualizer( props );
	const styles = {
		borderTop: getClampedWidthBorderStyle( value?.top ),
		borderRight: getClampedWidthBorderStyle( value?.right ),
		borderBottom: getClampedWidthBorderStyle( value?.bottom ),
		borderLeft: getClampedWidthBorderStyle( value?.left ),
	};

	return <View { ...otherProps } ref={ forwardedRef } style={ styles } />;
};

const ConnectedBorderBoxControlVisualizer = contextConnect(
	BorderBoxControlVisualizer,
	'BorderBoxControlVisualizer'
);
export default ConnectedBorderBoxControlVisualizer;
