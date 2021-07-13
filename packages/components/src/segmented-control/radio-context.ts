/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { SegmentedControlRadioState } from './types';

const RadioContext = createContext( {} as SegmentedControlRadioState );

export default RadioContext;
