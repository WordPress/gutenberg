/**
 * External dependencies
 */
// Custom Jest matchers.
import '@testing-library/jest-dom';
// Fetch polyfill for Node.js environment.
import 'whatwg-fetch';
// Expose window.jQuery for third-party code.
import jQuery from 'jquery';

window.jQuery = jQuery;
