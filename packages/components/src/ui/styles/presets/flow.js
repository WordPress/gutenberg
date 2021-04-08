/**
 * Internal dependencies
 */
import { flow as baseFlow } from '../mixins/flow';

/* eslint-disable jsdoc/valid-types */
/**
 * @type {{
	(...args: (string|string[])[]): string;
	calc: (...args: (string|string[])[]) => string;
}}
 */
/* eslint-enable jsdoc/valid-types */
// @ts-ignore We add calc below
export const flow = baseFlow;

flow.calc = ( ...args ) => `calc(${ baseFlow( ...args ) })`;
