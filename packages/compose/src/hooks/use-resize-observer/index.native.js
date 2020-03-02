/**
 * External dependencies
 */
import { View, StyleSheet } from 'react-native';
/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';

/**
 * Hook which allows to listen the resize event of any target element when it changes sizes.
 *
 * @return {Object} Measurements object with properties `width` and `height`.
 *
 * @example
 *
 * ```js
 * const App = () => {
 * 	const [ resizeListener, sizes ] = useResizeObserver();
 *
 * 	return (
 * 		<View>
 * 			{ resizeListener }
 * 			Your content here
 * 		</View>
 * 	);
 * };
 * ```
 *
 */
const useResizeObserver = () => {
	const [ measurements, setMeasurements ] = useState( null );

	const onLayout = useCallback( ( { nativeEvent } ) => {
		const { width, height } = nativeEvent.layout;

		setMeasurements( { width, height } );
	}, [] );

	const resizeObserver = () => {
		return (
			<View
				style={ { ...StyleSheet.absoluteFill } }
				onLayout={ onLayout }
			/>
		);
	};

	return [ resizeObserver(), measurements ];
};

export default useResizeObserver;
