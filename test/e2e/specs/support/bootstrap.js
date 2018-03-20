/* eslint-env jest */
/* global browser */
import puppeteer from 'puppeteer';

beforeAll( async () => {
	global.browser = await puppeteer.launch();
	global.page = await browser.newPage();
} );

afterAll( async () => {
	await browser.close();
} );
