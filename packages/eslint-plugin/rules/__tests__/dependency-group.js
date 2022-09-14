/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../dependency-group';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'dependency-group', rule, {
	valid: [
		{
			code: `
/**
 * External dependencies
 */
import { camelCase } from 'change-case';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import edit from './edit';`,
		},
		{
			code: `
/**
 * External dependencies
 */
const { camelCase } = require( 'change-case' );
const classnames = require( 'classnames' );

/**
 * WordPress dependencies
 */
const { Component } = require( '@wordpress/element' );

/**
 * Internal dependencies
 */
const edit = require( './edit' );`,
		},
	],
	invalid: [
		{
			code: `
import { camelCase } from 'change-case';
import classnames from 'classnames';
/*
 * wordpress dependencies.
 */
import { Component } from '@wordpress/element';
import edit from './edit';`,
			errors: [
				{
					message:
						'Expected preceding "External dependencies" comment block',
				},
				{
					message:
						'Expected preceding "WordPress dependencies" comment block',
				},
				{
					message:
						'Expected preceding "Internal dependencies" comment block',
				},
			],
			output: `
/**
 * External dependencies
 */
import { camelCase } from 'change-case';
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
/**
 * Internal dependencies
 */
import edit from './edit';`,
		},
		{
			code: `
const { camelCase } = require( 'change-case' );
const classnames = require( 'classnames' );
/*
 * wordpress dependencies.
 */
const { Component } = require( '@wordpress/element' );
const edit = require( './edit' );`,
			errors: [
				{
					message:
						'Expected preceding "External dependencies" comment block',
				},
				{
					message:
						'Expected preceding "WordPress dependencies" comment block',
				},
				{
					message:
						'Expected preceding "Internal dependencies" comment block',
				},
			],
			output: `
/**
 * External dependencies
 */
const { camelCase } = require( 'change-case' );
const classnames = require( 'classnames' );
/**
 * WordPress dependencies
 */
const { Component } = require( '@wordpress/element' );
/**
 * Internal dependencies
 */
const edit = require( './edit' );`,
		},
	],
} );
