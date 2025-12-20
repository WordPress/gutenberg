/**
 * Internal dependencies
 */
import { FRAME_TIME } from './constants';

/**
 * Advance Reanimated animations by frames.
 * This helper should be called within a function invoked by "withReanimatedTimer".
 *
 * NOTE: This code is based on a similar function provided by the Reanimated library.
 * Reference: https://github.com/software-mansion/react-native-reanimated/blob/b4ee4ea9a1f246c461dd1819c6f3d48440a25756/src/reanimated2/jestUtils.ts#L183-L188
 *
 * @param {number} count Number of frames to advance timers.
 */
export const advanceAnimationByFrames = ( count ) => {
	jest.advanceTimersByTime( count * FRAME_TIME );
	jest.runOnlyPendingTimers();
};
