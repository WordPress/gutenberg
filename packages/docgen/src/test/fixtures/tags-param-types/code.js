/* eslint-disable jsdoc/check-types */

/**
 * A function with many params.
 *
 * @param p undocumented type
 * @param {any} p any
 * @param {*} p jsdoc all types
 * @param {?} p jsdoc unknown
 * @param {unknown} p TS unknown
 * @param {string} p string
 * @param {String} p string in capital case
 * @param {number} p number
 * @param {Number} p number in capital case
 * @param {bigint} p bigint
 * @param {boolean} p boolean
 * @param {symbol} p symbol
 * @param {undefined} p undefined
 * @param {null} p null
 * @param {never} p never
 * @param {object} p object
 * @param {Object} p object in capital case
 * @param {Object.<string, number>} p jsdoc record type
 * @param {File} p random type name
 *
 */
// eslint-disable-next-line no-unused-vars
export const sum = ( p0, p1 ) => {};

/* eslint-enable jsdoc/check-types */

/**
 * @param {'string literal'} p string literal
 * @param {42} p number literal
 * @param {typeof J} p type query
 * @param {number[]} p number array
 * @param {Array<WPElements>} p TypeScript array
 * @param {Array.<WPElements>} p jsdoc style array
 * @param {[string, number]} p simple tuple
 * @param {[TypeChecker, SourceFile, string?]} p tuple with optionalType
 * @param {string | number} p union type
 * @param {X & Y} p intersection type
 * @param {?string} p jsdoc nullable 1
 * @param {string?} p jsdoc nullable 2
 * @param {number=} p jsdoc optional type
 * @param {number} [p] jsdoc optional type 2
 * @param {number} [p=42] jsdoc optional with default
 * @param {(string | number)} [p] parenthesized type
 * @param {!string} p jsdoc non-nullable type
 * @param {string!} p jsdoc non-nullable type
 * @param {[string, ...X]} p rest type
 * @param {...number[]} p jsdoc variadic type
 * @param {(x: number, y: Test) => number} p function type
 * @param {(a: string, b: string) => {x: string, y: string}} p function + type literal
 * @param {(k: () => number) => React.FC} p function arg
 * @param {() => void} p functino void return type
 * @param {new () => T} p constructor type
 * @param {{x: number, y: XY}} p type literal
 * @param {{[setting:string]:any}} p indexable interface
 * @param {{j: (a: string) => number, k: number}} p function as type literal property type
 * @param {Object} p jsdoc type literal
 * @param {string} p.x0 property 0
 * @param {XXX} [p.x1] property 1
 * @param {number} [p.x2=11] property 2
 * @param {function(b): c} p jsdoc function type
 * @param {keyof X} p jsdoc type operator 1: keyof
 * @param {readonly Y} p jsdoc type operator 2: readonly
 * @param {unique symbol} p jsdoc type operator 3: unique
 * @param {T['key']} p indexed access type
 * @param {{readonly [P in keyof T]: T[P]}} p mapped type
 * @param {T extends U ? X : Y} p conditional type
 * @param {T extends (...args: any[]) => infer R ? R : any} p infer type
 * @param {import('typescript').Statement} p import type
 * @param {asdf} p identifier
 *
 */

// @param {void} p9 void -> should be tested with functions

// ignore ThisType or ThisKeyword
// ignore TypePredicate boolean
// ignore ExpressionWithTypeArguments -> class argument
// JSDocSignature -> type definition of @callback
