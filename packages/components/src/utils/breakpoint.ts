import breakpoints from './breakpoint-values';

/**
 * @param point
 * @return Media query declaration.
 */
export const breakpoint = ( point: keyof typeof breakpoints ) =>
	`@media (min-width: ${ breakpoints[ point ] })`;
