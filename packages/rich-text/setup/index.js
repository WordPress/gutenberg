/**
 * WordPress dependencies
 */
import { render, createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { RichText, toggleFormat } from '../src';

// Expose component to be tested.
window.test = { render, createElement, RichText, toggleFormat };
