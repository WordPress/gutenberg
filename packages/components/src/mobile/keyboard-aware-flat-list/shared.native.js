/**
 * Optimization properties for FlatList.
 * @typedef {Object} OptimizationProps
 * @property {number} maxToRenderPerBatch - Controls the amount of items rendered per batch during scrolling.
 *                                        Increasing this number reduces visual blank areas but may affect responsiveness.
 *                                        Default: 10
 * @property {number} windowSize          - Measurement unit representing viewport height.
 *                                        Default: 21 (10 viewports above, 10 below, and 1 in between).
 *                                        Larger values reduce chances of seeing blank spaces while scrolling but increase memory consumption.
 *                                        Smaller values save memory but increase chances of seeing blank areas.
 */

/**
 * Threshold for applying optimization settings.
 * @type {number}
 */
export const OPTIMIZATION_ITEMS_THRESHOLD = 30;

/**
 * Optimization properties for FlatList.
 * @type {OptimizationProps}
 */
export const OPTIMIZATION_PROPS = {
	maxToRenderPerBatch: 15,
	windowSize: 17,
};
