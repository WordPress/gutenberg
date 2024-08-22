/**
 * Internal dependencies
 */
import { ZWNBSP, OBJECT_REPLACEMENT_CHARACTER } from '../../special-characters';

export function getSparseArrayLength( array ) {
	return array.reduce( ( accumulator ) => accumulator + 1, 0 );
}

const em = { type: 'em' };
const strong = { type: 'strong' };
const img = { type: 'img', attributes: { src: '' } };
const a = { type: 'a', attributes: { href: '#' } };

export const spec = [
	{
		description: 'should create an empty value',
		html: '',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 0,
			endContainer: element,
		} ),
		startPath: [ 0, 0 ],
		endPath: [ 0, 0 ],
		record: {
			start: 0,
			end: 0,
			formats: [],
			replacements: [],
			text: '',
		},
	},
	{
		description:
			'should ignore manually added object replacement character',
		html: `test${ OBJECT_REPLACEMENT_CHARACTER }`,
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 1,
			endContainer: element,
		} ),
		startPath: [ 0, 0 ],
		endPath: [ 0, 4 ],
		record: {
			start: 0,
			end: 4,
			formats: [ , , , , ],
			replacements: [ , , , , ],
			text: 'test',
		},
	},
	{
		description:
			'should ignore manually added object replacement character with formatting',
		html: `<em>h${ OBJECT_REPLACEMENT_CHARACTER }i</em>`,
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 1,
			endContainer: element,
		} ),
		startPath: [ 0, 0, 0 ],
		endPath: [ 0, 0, 2 ],
		record: {
			start: 0,
			end: 2,
			formats: [ [ em ], [ em ] ],
			replacements: [ , , ],
			text: 'hi',
		},
	},
	{
		description: 'should preserve non breaking space',
		html: 'test\u00a0 test',
		createRange: ( element ) => ( {
			startOffset: 5,
			startContainer: element.firstChild,
			endOffset: 5,
			endContainer: element.firstChild,
		} ),
		startPath: [ 0, 5 ],
		endPath: [ 0, 5 ],
		record: {
			start: 5,
			end: 5,
			formats: [ , , , , , , , , , , ],
			replacements: [ , , , , , , , , , , ],
			text: 'test\u00a0 test',
		},
	},
	{
		description: 'should create an empty value from empty tags',
		html: '<em></em>',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 1,
			endContainer: element,
		} ),
		startPath: [ 0, 0 ],
		endPath: [ 0, 0 ],
		record: {
			start: 0,
			end: 0,
			formats: [],
			replacements: [],
			text: '',
		},
	},
	{
		description: 'should create a value without formatting',
		html: 'test',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element.firstChild,
			endOffset: 4,
			endContainer: element.firstChild,
		} ),
		startPath: [ 0, 0 ],
		endPath: [ 0, 4 ],
		record: {
			start: 0,
			end: 4,
			formats: [ , , , , ],
			replacements: [ , , , , ],
			text: 'test',
		},
	},
	{
		description: 'should preserve emoji',
		html: '🍒',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 1,
			endContainer: element,
		} ),
		startPath: [ 0, 0 ],
		endPath: [ 0, 2 ],
		record: {
			start: 0,
			end: 2,
			formats: [ , , ],
			replacements: [ , , ],
			text: '🍒',
		},
	},
	{
		description: 'should preserve emoji in formatting',
		html: '<em>🍒</em>',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 1,
			endContainer: element,
		} ),
		startPath: [ 0, 0, 0 ],
		endPath: [ 0, 0, 2 ],
		record: {
			start: 0,
			end: 2,
			formats: [ [ em ], [ em ] ],
			replacements: [ , , ],
			text: '🍒',
		},
	},
	{
		description: 'should create a value with formatting',
		html: '<em>test</em>',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element.firstChild,
			endOffset: 1,
			endContainer: element.firstChild,
		} ),
		startPath: [ 0, 0, 0 ],
		endPath: [ 0, 0, 4 ],
		record: {
			start: 0,
			end: 4,
			formats: [ [ em ], [ em ], [ em ], [ em ] ],
			replacements: [ , , , , ],
			text: 'test',
		},
	},
	{
		description: 'should create a value with nested formatting',
		html: '<em><strong>test</strong></em>',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 1,
			endContainer: element,
		} ),
		startPath: [ 0, 0, 0, 0 ],
		endPath: [ 0, 0, 0, 4 ],
		record: {
			start: 0,
			end: 4,
			formats: [
				[ em, strong ],
				[ em, strong ],
				[ em, strong ],
				[ em, strong ],
			],
			replacements: [ , , , , ],
			text: 'test',
		},
	},
	{
		description: 'should create a value with formatting for split tags',
		html: '<em>te</em><em>st</em>',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element.querySelector( 'em' ),
			endOffset: 1,
			endContainer: element.querySelector( 'em' ),
		} ),
		startPath: [ 0, 0, 0 ],
		endPath: [ 0, 0, 2 ],
		record: {
			start: 0,
			end: 2,
			formats: [ [ em ], [ em ], [ em ], [ em ] ],
			replacements: [ , , , , ],
			text: 'test',
		},
	},
	{
		description: 'should create a value with formatting with attributes',
		html: '<a href="#">test</a>',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 1,
			endContainer: element,
		} ),
		startPath: [ 0, 0, 0 ],
		endPath: [ 0, 0, 4 ],
		record: {
			start: 0,
			end: 4,
			formats: [ [ a ], [ a ], [ a ], [ a ] ],
			replacements: [ , , , , ],
			text: 'test',
		},
	},
	{
		description: 'should create a value with image object',
		html: '<img src="">',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 1,
			endContainer: element,
		} ),
		startPath: [ 0, 0 ],
		endPath: [ 0, 0 ],
		record: {
			start: 0,
			end: 0,
			formats: [ , ],
			replacements: [ img ],
			text: '\ufffc',
		},
	},
	{
		description: 'should create a value with image object and formatting',
		html: '<em><img src=""></em>',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element.querySelector( 'img' ),
			endOffset: 1,
			endContainer: element.querySelector( 'img' ),
		} ),
		startPath: [ 0, 0, 0 ],
		endPath: [ 0, 2, 0 ],
		record: {
			start: 0,
			end: 1,
			formats: [ [ em ] ],
			replacements: [ img ],
			text: '\ufffc',
		},
	},
	{
		description: 'should create a value with image object and text before',
		html: 'te<em>st<img src=""></em>',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 2,
			endContainer: element,
		} ),
		startPath: [ 0, 0 ],
		endPath: [ 1, 2, 0 ],
		record: {
			start: 0,
			end: 5,
			formats: [ , , [ em ], [ em ], [ em ] ],
			replacements: [ , , , , img ],
			text: 'test\ufffc',
		},
	},
	{
		description: 'should create a value with image object and text after',
		html: '<em><img src="">te</em>st',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 2,
			endContainer: element,
		} ),
		startPath: [ 0, 0, 0 ],
		endPath: [ 1, 2 ],
		record: {
			start: 0,
			end: 5,
			formats: [ [ em ], [ em ], [ em ], , , ],
			replacements: [ img, , , , , ],
			text: '\ufffctest',
		},
	},
	{
		description: 'should handle br',
		html: '<br>',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 1,
			endContainer: element,
		} ),
		startPath: [ 0, 0 ],
		endPath: [ 0, 0 ],
		record: {
			start: 0,
			end: 0,
			formats: [ , ],
			replacements: [ , ],
			text: '\n',
		},
	},
	{
		description: 'should handle br with text',
		html: 'te<br>st',
		createRange: ( element ) => ( {
			startOffset: 1,
			startContainer: element,
			endOffset: 2,
			endContainer: element,
		} ),
		startPath: [ 0, 2 ],
		endPath: [ 2, 0 ],
		record: {
			start: 2,
			end: 3,
			formats: [ , , , , , ],
			replacements: [ , , , , , ],
			text: 'te\nst',
		},
	},
	{
		description: 'should handle br with formatting',
		html: '<em><br></em>',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 1,
			endContainer: element,
		} ),
		startPath: [ 0, 0, 0 ],
		endPath: [ 0, 2, 0 ],
		record: {
			start: 0,
			end: 1,
			formats: [ [ em ] ],
			replacements: [ , ],
			text: '\n',
		},
	},
	{
		description: 'should handle double br',
		html: 'a<br><br>b',
		createRange: ( element ) => ( {
			startOffset: 2,
			startContainer: element,
			endOffset: 3,
			endContainer: element,
		} ),
		startPath: [ 2, 0 ],
		endPath: [ 4, 0 ],
		record: {
			formats: [ , , , , ],
			replacements: [ , , , , ],
			text: 'a\n\nb',
			start: 2,
			end: 3,
		},
	},
	{
		description: 'should handle selection before br',
		html: 'a<br><br>b',
		createRange: ( element ) => ( {
			startOffset: 2,
			startContainer: element,
			endOffset: 2,
			endContainer: element,
		} ),
		startPath: [ 2, 0 ],
		endPath: [ 2, 0 ],
		record: {
			formats: [ , , , , ],
			replacements: [ , , , , ],
			text: 'a\n\nb',
			start: 2,
			end: 2,
		},
	},
	{
		description: 'should remove padding',
		html: ZWNBSP,
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 1,
			endContainer: element,
		} ),
		startPath: [ 0, 0 ],
		endPath: [ 0, 0 ],
		record: {
			start: 0,
			end: 0,
			formats: [],
			replacements: [],
			text: '',
		},
	},
	{
		description: 'should filter format boundary attributes',
		html: '<strong data-rich-text-format-boundary="true">test</strong>',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 1,
			endContainer: element,
		} ),
		startPath: [ 0, 0, 0 ],
		endPath: [ 0, 0, 4 ],
		record: {
			start: 0,
			end: 4,
			formats: [ [ strong ], [ strong ], [ strong ], [ strong ] ],
			replacements: [ , , , , ],
			text: 'test',
		},
	},
	{
		description: 'should not error with overlapping formats (1)',
		html: '<a href="#"><em>1</em><strong>2</strong></a>',
		createRange: ( element ) => ( {
			startOffset: 1,
			startContainer: element.firstChild,
			endOffset: 1,
			endContainer: element.firstChild,
		} ),
		startPath: [ 0, 0, 0, 1 ],
		endPath: [ 0, 0, 0, 1 ],
		record: {
			start: 1,
			end: 1,
			formats: [
				[ a, em ],
				[ a, strong ],
			],
			replacements: [ , , ],
			text: '12',
		},
	},
	{
		description: 'should not error with overlapping formats (2)',
		html: '<em><a href="#">1</a></em><strong><a href="#">2</a></strong>',
		createRange: ( element ) => ( {
			startOffset: 1,
			startContainer: element.firstChild,
			endOffset: 1,
			endContainer: element.firstChild,
		} ),
		startPath: [ 0, 0, 0, 1 ],
		endPath: [ 0, 0, 0, 1 ],
		record: {
			start: 1,
			end: 1,
			formats: [
				[ em, a ],
				[ strong, a ],
			],
			replacements: [ , , ],
			text: '12',
		},
	},
	{
		description: 'should disarm script',
		html: '<script>alert("1")</script>',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 0,
			endContainer: element,
		} ),
		startPath: [ 0, 0 ],
		endPath: [ 0, 0 ],
		record: {
			start: 0,
			end: 0,
			formats: [ , ],
			replacements: [
				{
					attributes: { 'data-rich-text-script': 'alert(%221%22)' },
					type: 'script',
				},
			],
			text: '\ufffc',
		},
	},
	{
		description: 'should disarm on* attribute',
		html: '<img onerror="alert(\'1\')">',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 0,
			endContainer: element,
		} ),
		startPath: [ 0, 0 ],
		endPath: [ 0, 0 ],
		record: {
			start: 0,
			end: 0,
			formats: [ , ],
			replacements: [
				{
					attributes: {
						'data-disable-rich-text-onerror': "alert('1')",
					},
					type: 'img',
				},
			],
			text: '\ufffc',
		},
	},
	{
		description: 'should preserve comments',
		html: '<!--comment-->',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 1,
			endContainer: element,
		} ),
		startPath: [ 0, 0 ],
		endPath: [ 2, 0 ],
		record: {
			start: 0,
			end: 1,
			formats: [ , ],
			replacements: [
				{
					attributes: {
						'data-rich-text-comment': 'comment',
					},
					type: '#comment',
				},
			],
			text: '\ufffc',
		},
	},
	{
		description: 'should preserve funky comments',
		html: '<//funky>',
		createRange: ( element ) => ( {
			startOffset: 0,
			startContainer: element,
			endOffset: 1,
			endContainer: element,
		} ),
		startPath: [ 0, 0 ],
		endPath: [ 2, 0 ],
		record: {
			start: 0,
			end: 1,
			formats: [ , ],
			replacements: [
				{
					attributes: {
						'data-rich-text-comment': '/funky',
					},
					type: '#comment',
				},
			],
			text: '\ufffc',
		},
	},
];

export const specWithRegistration = [
	{
		description: 'should create format by matching the class',
		formatName: 'my-plugin/link',
		formatType: {
			title: 'Custom Link',
			tagName: 'a',
			className: 'custom-format',
			edit() {},
		},
		html: '<a class="custom-format">a</a>',
		value: {
			formats: [
				[
					{
						type: 'my-plugin/link',
						tagName: 'a',
						attributes: {},
						unregisteredAttributes: {},
					},
				],
			],
			replacements: [ , ],
			text: 'a',
		},
	},
	{
		description: 'should retain class names',
		formatName: 'my-plugin/link',
		formatType: {
			title: 'Custom Link',
			tagName: 'a',
			className: 'custom-format',
			edit() {},
		},
		html: '<a class="custom-format test">a</a>',
		value: {
			formats: [
				[
					{
						type: 'my-plugin/link',
						tagName: 'a',
						attributes: {},
						unregisteredAttributes: {
							class: 'test',
						},
					},
				],
			],
			replacements: [ , ],
			text: 'a',
		},
	},
	{
		description: 'should create base format',
		formatName: 'core/link',
		formatType: {
			title: 'Link',
			tagName: 'a',
			className: null,
			edit() {},
		},
		html: '<a class="custom-format">a</a>',
		value: {
			formats: [
				[
					{
						type: 'core/link',
						tagName: 'a',
						attributes: {},
						unregisteredAttributes: {
							class: 'custom-format',
						},
					},
				],
			],
			replacements: [ , ],
			text: 'a',
		},
	},
	{
		description: 'should create fallback format',
		html: '<a class="custom-format">a</a>',
		value: {
			formats: [
				[
					{
						type: 'a',
						attributes: {
							class: 'custom-format',
						},
					},
				],
			],
			replacements: [ , ],
			text: 'a',
		},
	},
	{
		description: 'should not create format if editable tree only',
		formatName: 'my-plugin/link',
		formatType: {
			title: 'Custom Link',
			tagName: 'a',
			className: 'custom-format',
			edit() {},
			__experimentalCreatePrepareEditableTree() {},
		},
		html: '<a class="custom-format">a</a>',
		value: {
			formats: [ , ],
			replacements: [ , ],
			text: 'a',
		},
		noToHTMLString: true,
	},
	{
		description:
			'should create format if editable tree only but changes need to be recorded',
		formatName: 'my-plugin/link',
		formatType: {
			title: 'Custom Link',
			tagName: 'a',
			className: 'custom-format',
			edit() {},
			__experimentalCreatePrepareEditableTree() {},
			__experimentalCreateOnChangeEditableValue() {},
		},
		html: '<a class="custom-format">a</a>',
		value: {
			formats: [
				[
					{
						type: 'my-plugin/link',
						tagName: 'a',
						attributes: {},
						unregisteredAttributes: {},
					},
				],
			],
			replacements: [ , ],
			text: 'a',
		},
	},
	{
		description: 'should be non editable',
		formatName: 'my-plugin/non-editable',
		formatType: {
			title: 'Non Editable',
			tagName: 'a',
			className: 'non-editable',
			contentEditable: false,
			edit() {},
		},
		html: '<a class="non-editable">a</a>',
		value: {
			formats: [ , ],
			replacements: [
				{
					type: 'my-plugin/non-editable',
					tagName: 'a',
					attributes: {},
					unregisteredAttributes: {},
					innerHTML: 'a',
				},
			],
			text: OBJECT_REPLACEMENT_CHARACTER,
		},
	},
];
