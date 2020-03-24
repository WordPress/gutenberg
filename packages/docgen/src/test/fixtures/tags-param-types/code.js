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
 * @param {'string literal'} p string literal
 * @param {42} p number literal
 * @param {true} p true keyword
 * @param {false} p false keyword
 * @param {typeof J} p type query
 * @param {number[]} p number array
 * @param {Array<WPElements>} p array 2
 * @param {Array.<WPElements>} p jsdoc style array
 * @param {Array} p simple array
 * @param {[string, number]} p simple tuple
 * @param {[TypeChecker, SourceFile, string?]} p tuple with optional type
 * @param {?string} p jsdoc nullable 1
 * @param {WPElements?} p jsdoc nullable 2
 * @param {string | number} p union type
 * @param {X & Y} p intersection type
 * @param {X & Y | Z} p union + intersection type
 * @param {number=} p jsdoc optional type
 * @param {number} [p] jsdoc optional type 2
 * @param {number} [p=42] jsdoc optional with default: integer type
 * @param {number} [p=3.141592] jsdoc optional with default: float type
 * @param {string} [p='John Doe'] jsdoc optional with default: string type
 * @param {string} [p="John 'Mark' Doe"] jsdoc optional with default: string type 2
 * @param {string} [p=`Test "double" 'single' quotes`] jsdoc optional with default: string type 3
 * @param {string} [p='10px'] jsdoc optional with default: string type 4
 * @param {?string} [p=null] jsdoc optional with default: null keyword
 * @param {boolean} [p=true] jsdoc optional with default: true keyword
 * @param {boolean} [p=false] jsdoc optional with default: false keyword
 * @param {object} [p={ x: 3, y: null }] jsdoc optional with default: object type
 * @param {number[]} [p=[ 1, 2, 3 ]] jsdoc optional with default: array type
 * @param {(XX | YY) & ZZ} p parenthesized type
 * @param {!string} p jsdoc non-nullable type
 * @param {string!} p jsdoc non-nullable type 2
 * @param {[string, ...X]} p rest type
 * @param {...number} p jsdoc variadic type
 * @param {(x: number, y: Test) => number} p function type
 * @param {(a: string, b: string) => {x: string, y: string}} p function + type literal
 * @param {(k: () => number) => React.FC} p function arg
 * @param {() => void} p function void return type
 * @param {new () => T} p constructor type
 * @param {function(b): c} p jsdoc function type
 * @param {{x: number, y: XY}} p type literal
 * @param {{[setting:string]:any}} p indexable interface
 * @param {{j: (a: string) => number, k: number}} p function as type literal property type
 * @param {object} p jsdoc type literal
 * @param {string} p.x0 property 0
 * @param {XXX} [p.x1] property 1
 * @param {number} [p.x2=11] property 2
 *
 */
// eslint-disable-next-line no-unused-vars
export const sum = ( p0, p1 ) => {};

/* eslint-enable jsdoc/check-types */

/**
 * @param {keyof X} p jsdoc type operator 1: keyof
 * @param {readonly Y} p jsdoc type operator 2: readonly
 * @param {unique symbol} p jsdoc type operator 3: unique
 * @param {T['key']} p indexed access type
 * @param {{readonly [P in keyof T]: T[P]}} p mapped type
 * @param {T extends U ? X : Y} p conditional type
 * @param {T extends (...args: any[]) => infer R ? R : any} p infer type
 * @param {import('typescript').Statement} p import type
 * @param {asdf} p identifier
 * @param {string} p
 *
 */

// @param {void} p9 void -> should be tested with functions

// ignore ThisType or ThisKeyword
// ignore TypePredicate boolean
// ignore ExpressionWithTypeArguments -> class argument
// JSDocSignature -> type definition of @callback
//  * @param {string} [somebody=John Doe] - Somebody's name. -> It doesn't work. This should be disallowed.
