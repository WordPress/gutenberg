/* eslint-disable jsdoc/check-types */
/* eslint-disable jsdoc/valid-types */
/* eslint-disable jsdoc/check-param-names */
/* eslint-disable jsdoc/require-param-type */
/* eslint-disable jsdoc/no-undefined-types */

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
 * @param {RandomName<string | number, number, Y>} p generics
 * @param {React.Component<Props, State>} p generics with qualified name
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
 * @param {string} [p]
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
 * @param {(number[] | number)[]} [p=[ 1, [ 2, 3 ] ]] jsdoc optional with default: nested array type
 * @param {boolean} [p=true] Whether block selection should
 *                           be enabled.
 * @param {string} [p='gutenberg']
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
 * @param {?Object} p             nullable obj
 * @param {?string} p.version     Version in which the feature will be removed.
 * @param {object=} p optional obj
 * @param {?number} p.number number description
 * @param {?number} p.number2 number2 description
 * @param {object} [p] optional obj 2
 * @param {boolean} p.bo boolean description
 * @param {keyof X} p jsdoc type operator 1: keyof
 * @param {readonly Y} p jsdoc type operator 2: readonly
 * @param {unique symbol} p jsdoc type operator 3: unique
 * @param {T['key']} p indexed access type
 * @param {{[P in keyof T]?: T[P]}} p mapped type 1: Partial
 * @param {{[P in keyof T]: T[P] | null}} p mapped type 2: Nullable
 * @param {{readonly [P in keyof T]: T[P]}} p mapped type 3: Readonly
 * @param {T extends U ? X : Y} p conditional type
 * @param {T extends (...args: any[]) => infer R ? R : any} p infer type: ReturnType
 * @param {import('typescript').Statement} p import type
 * @param {WPEditorInserterItem} p typedef
 * @param {string} __experimentalParam It's experimental
 * @param {number} __unstableParam It's unstable
 * @param {string}   p.val  Test when 2 consecutive qualified names have different first part.
 * @param {boolean}   props.value  Qualified name without an object definition above.
 *
 * @typedef {object} WPEditorInserterItem
 * @property {number}   id                Unique identifier for the item.
 * @property {string}   name              The type of block to create.
 * @property {boolean} __experimentalBlockDirectory Whether the user has enabled the Block Directory
 * @property {boolean} __unstableProp This is unstable.
 */
// eslint-disable-next-line no-unused-vars
export const sum = ( p ) => {};

/* eslint-enable jsdoc/no-undefined-types */
/* eslint-enable jsdoc/require-param-type */
/* eslint-enable jsdoc/check-param-names */
/* eslint-enable jsdoc/valid-types */
/* eslint-enable jsdoc/check-types */
