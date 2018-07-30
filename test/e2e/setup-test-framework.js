/**
 * External dependencies
 */
import 'expect-puppeteer';

/**
 * Environment variables
 */
const { PUPPETEER_TIMEOUT } = process.env;

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( PUPPETEER_TIMEOUT || 100000 );
