/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { useBorderBoxControlVisualizer } from './hook';

import type { VisualizerProps } from '../types';

const BorderBoxControlVisualizer = (
	props: WordPressComponentProps< VisualizerProps, 'div' >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const { value, ...otherProps } = useBorderBoxControlVisualizer( props );

	return <View { ...otherProps } ref={ forwardedRef } />;
};

const ConnectedBorderBoxControlVisualizer = contextConnect(
	BorderBoxControlVisualizer,
	'BorderBoxControlVisualizer'
);
export default ConnectedBorderBoxControlVisualizer;
