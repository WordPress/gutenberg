/**
 * The prefix used with directives.
 *
 * @type {string}
 */
const DIRECTIVE_PREFIX = 'data-wp-';

/**
 * Directives.
 *
 * @type Map<string, Function>
 */
export const directives = new Map();

/**
 * Registers a new directive.
 *
 * @param {string}   name    Name of the directive.
 * @param {Function} handler Handler for the directive.
 */
export function registerDirective( name, handler ) {
	directives.set( DIRECTIVE_PREFIX + name, handler );
}
