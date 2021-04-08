/**
 * Uses the the prefix for the CSS variables compiled by the system.
 */
export const NAMESPACE = '--wp-experimental';

export const DARK_MODE_ATTR_PROP = 'data-system-ui-mode';
export const HIGH_CONTRAST_MODE_ATTR_PROP = 'data-system-ui-contrast-mode';
export const COLOR_BLIND_MODE_ATTR_PROP = 'data-system-ui-color-blind-mode';
export const REDUCED_MOTION_MODE_ATTR_PROP =
	'data-system-ui-reduced-motion-mode';

export const DARK_MODE_ATTR = `[${ DARK_MODE_ATTR_PROP }="dark"]`;
export const HIGH_CONTRAST_MODE_MODE_ATTR = `[${ HIGH_CONTRAST_MODE_ATTR_PROP }="high"]`;

export const COLOR_BLIND_MODE_ATTR = `[${ COLOR_BLIND_MODE_ATTR_PROP }="true"]`;
export const REDUCED_MOTION_MODE_ATTR = `[${ REDUCED_MOTION_MODE_ATTR_PROP }="true"]`;

export const DARK_HIGH_CONTRAST_MODE_MODE_ATTR = `${ DARK_MODE_ATTR }${ HIGH_CONTRAST_MODE_MODE_ATTR }`;

export const MODE_SPECIFICITY_COMPOUND_LEVEL = 3;

export const INTERPOLATION_CLASS_NAME = '__interpolationClassName__';
