import { fixGlobalAttributes } from '../fix-global-attribute';

describe( 'fixGlobalAttributes', () => {
	const blockSettings = {
		save: () => <ul className="wp-block-list" />,
		category: 'text',
		title: 'block title',
	};

	it( 'should do nothing if the block opts out of globalAttributes support', () => {
		const attributes = fixGlobalAttributes(
			{},
			{
				...blockSettings,
				supports: {
					globalAttributes: false,
				},
			},
			'<ul aria-describedby="test" class="wp-block-list"></ul>'
		);

		expect( attributes.globalAttributes ).toBeUndefined();
	} );

	it( 'should restore global attributes authored on the root element', () => {
		const attributes = fixGlobalAttributes(
			{},
			blockSettings,
			'<ul aria-describedby="test" role="list" lang="en" class="wp-block-list"></ul>'
		);

		expect( attributes.globalAttributes ).toEqual( {
			'aria-describedby': 'test',
			role: 'list',
			lang: 'en',
		} );
	} );

	it( 'should not override attributes already parsed from the comment delimiter', () => {
		const attributes = fixGlobalAttributes(
			{ globalAttributes: { 'aria-describedby': 'from-delimiter' } },
			blockSettings,
			'<ul aria-describedby="from-markup" class="wp-block-list"></ul>'
		);

		expect( attributes.globalAttributes ).toEqual( {
			'aria-describedby': 'from-delimiter',
		} );
	} );

	it( 'should ignore attributes outside the allow list', () => {
		const attributes = fixGlobalAttributes(
			{},
			blockSettings,
			'<ul onclick="alert(1)" data-foo="bar" style="color:red" class="wp-block-list" id="x" aria-label="y"></ul>'
		);

		expect( attributes.globalAttributes ).toBeUndefined();
	} );

	it( 'should return the original attributes when there is nothing to restore', () => {
		const original = {};
		const attributes = fixGlobalAttributes(
			original,
			blockSettings,
			'<ul class="wp-block-list"></ul>'
		);

		expect( attributes ).toBe( original );
	} );
} );
