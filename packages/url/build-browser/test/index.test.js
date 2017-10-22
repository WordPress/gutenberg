'use strict';

var _ = require('../');

describe('addQueryArgs', function () {
	test('should append args to an URL without query string', function () {
		var url = 'https://andalouses.com/beach';
		var args = { sun: 'true', sand: 'false' };

		expect((0, _.addQueryArgs)(url, args)).toBe('https://andalouses.com/beach?sun=true&sand=false');
	});

	test('should append args to an URL with query string', function () {
		var url = 'https://andalouses.com/beach?night=false';
		var args = { sun: 'true', sand: 'false' };

		expect((0, _.addQueryArgs)(url, args)).toBe('https://andalouses.com/beach?night=false&sun=true&sand=false');
	});
}); /**
     * Internal Dependencies
     */