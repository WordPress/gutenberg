/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { SegmentedControlContextProps } from './types';

const SegmentedControlContext = createContext(
	{} as SegmentedControlContextProps
);
export const useSegmentedControlContext = () =>
	useContext( SegmentedControlContext );
export default SegmentedControlContext;
