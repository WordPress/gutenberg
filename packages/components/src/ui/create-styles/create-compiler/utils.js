/**
 * Breakpoint values used for responsive style rendering.
 */
/**
 * @type {['40em', '52em', '64em']}
 */
export const breakpoints = [ '40em', '52em', '64em' ];

let currentInterpolationId = 0;
/**
 * @return {string} Interpolation class name.
 */
export const generateInterpolationName = () => {
	return `interpolatable-component-${ currentInterpolationId++ }`;
};
