/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-unjustified-disable';

const ruleTester = new RuleTester();

ruleTester.run( 'no-unjustified-disable', rule, {
	valid: [
		{
			code: `
/* Disable reason: The rule is not applicable because X, Y, Z. */
/* eslint-disable-next-line */
var f = foo();`,
		},
		{
			code: `
// Disable reason: The rule is not applicable because remediation steps X, Y,
// and Z have accounted for the problems otherwise anticipated.

// eslint-disable-next-line
var f = foo();`,
		},
		{
			code: `
/*
 * Disable reason: The rule is not applicable because remediation steps X, Y,
 * and Z have accounted for the problems otherwise anticipated.
 */

// eslint-disable-next-line
var f = foo();`,
		},
	],
	invalid: [
		{
			code: `
// eslint-disable
var f = foo();`,
			errors: [ { message: 'Justify disable with preceding "Disable reason:" comment.' } ],
			output: `
// Disable Reason: [Provide justification that the rule is not applicable].

// eslint-disable
var f = foo();`,
		},
		{
			code: `
// eslint-disable-next-line
var f = foo();`,
			errors: [ { message: 'Justify disable with preceding "Disable reason:" comment.' } ],
			output: `
// Disable Reason: [Provide justification that the rule is not applicable].

// eslint-disable-next-line
var f = foo();`,
		},
		{
			code: `
/* eslint-disable-next-line */
var f = foo();`,
			errors: [ { message: 'Justify disable with preceding "Disable reason:" comment.' } ],
			output: `
// Disable Reason: [Provide justification that the rule is not applicable].

/* eslint-disable-next-line */
var f = foo();`,
		},
		{
			code: `
/* Disable reason: The rule is not applicable because X, Y, Z. */
/* eslint-disable-next-line */
var f = foo();
/* eslint-disable-next-line */
var f = foo();`,
			errors: [ { message: 'Justify disable with preceding "Disable reason:" comment.' } ],
			output: `
/* Disable reason: The rule is not applicable because X, Y, Z. */
/* eslint-disable-next-line */
var f = foo();
// Disable Reason: [Provide justification that the rule is not applicable].

/* eslint-disable-next-line */
var f = foo();`,
		},
	],
} );
