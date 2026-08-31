import { updateActiveInlineImage } from '../utils';

const OBJECT_REPLACEMENT_CHARACTER = '\ufffc';

describe( 'updateActiveInlineImage', () => {
	it( 'updates width and alt while preserving registered attributes', () => {
		const value = {
			text: OBJECT_REPLACEMENT_CHARACTER,
			start: 0,
			end: 1,
			formats: [ , ],
			replacements: [
				{
					type: 'core/image',
					attributes: {
						className: 'wp-image-12',
						url: 'https://example.com/a.jpg',
						style: 'width: 100px;',
						alt: 'Before',
					},
				},
			],
		};

		const result = updateActiveInlineImage( value, {
			width: 200,
			alt: 'After',
		} );

		expect( result.replacements[ 0 ] ).toEqual( {
			type: 'core/image',
			attributes: {
				className: 'wp-image-12',
				url: 'https://example.com/a.jpg',
				style: 'width: 200px;',
				alt: 'After',
			},
		} );
	} );

	it( 'preserves unregistered attributes when editing width', () => {
		const value = {
			text: OBJECT_REPLACEMENT_CHARACTER,
			start: 0,
			end: 1,
			formats: [ , ],
			replacements: [
				{
					type: 'core/image',
					attributes: {
						className: 'wp-image-12',
						url: 'https://example.com/a.jpg',
						style: 'width: 100px;',
						alt: 'Photo',
					},
					unregisteredAttributes: {
						loading: 'lazy',
						srcset: 'https://example.com/a-2x.jpg 2x',
						'data-custom-id': 'abc',
					},
				},
			],
		};

		const result = updateActiveInlineImage( value, {
			width: 80,
			alt: 'Photo',
		} );

		expect( result.replacements[ 0 ].unregisteredAttributes ).toEqual( {
			loading: 'lazy',
			srcset: 'https://example.com/a-2x.jpg 2x',
			'data-custom-id': 'abc',
		} );
		expect( result.replacements[ 0 ].attributes.style ).toBe(
			'width: 80px;'
		);
	} );

	it( 'clears style when width is empty', () => {
		const value = {
			text: OBJECT_REPLACEMENT_CHARACTER,
			start: 0,
			end: 1,
			formats: [ , ],
			replacements: [
				{
					type: 'core/image',
					attributes: {
						url: 'https://example.com/a.jpg',
						style: 'width: 100px;',
						alt: '',
					},
				},
			],
		};

		const result = updateActiveInlineImage( value, {
			width: '',
			alt: '',
		} );

		expect( result.replacements[ 0 ].attributes.style ).toBe( '' );
	} );
} );
