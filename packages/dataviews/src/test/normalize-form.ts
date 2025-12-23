/**
 * Internal dependencies
 */
import normalizeForm from '../components/dataform-layouts/normalize-form';
import type { Form } from '../types';

describe( 'normalizeFormFields', () => {
	describe( 'empty form', () => {
		it( 'returns empty array for undefined fields', () => {
			const form: Form = {};
			const result = normalizeForm( form );
			expect( result ).toEqual( {
				fields: [],
				layout: { labelPosition: 'top', type: 'regular' },
			} );
		} );

		it( 'returns empty array for empty fields', () => {
			const form: Form = { fields: [] };
			const result = normalizeForm( form );
			expect( result ).toEqual( {
				fields: [],
				layout: { labelPosition: 'top', type: 'regular' },
			} );
		} );
	} );

	describe( 'default layout', () => {
		it( 'applies default layout when layout is not specified', () => {
			const form: Form = {
				fields: [ 'field1', 'field2' ],
			};
			const result = normalizeForm( form );
			expect( result ).toEqual( {
				layout: { labelPosition: 'top', type: 'regular' },
				fields: [
					{
						id: 'field1',
						layout: {
							type: 'regular',
							labelPosition: 'top',
						},
					},
					{
						id: 'field2',
						layout: {
							type: 'regular',
							labelPosition: 'top',
						},
					},
				],
			} );
		} );

		it( 'handles mixed string and object field specifications', () => {
			const form: Form = {
				fields: [
					'field1',
					{
						id: 'field2',
						label: 'Field 2',
					},
				],
			};
			const result = normalizeForm( form );
			expect( result ).toEqual( {
				layout: { labelPosition: 'top', type: 'regular' },
				fields: [
					{
						id: 'field1',
						layout: {
							type: 'regular',
							labelPosition: 'top',
						},
					},
					{
						id: 'field2',
						label: 'Field 2',
						layout: {
							type: 'regular',
							labelPosition: 'top',
						},
					},
				],
			} );
		} );
	} );

	describe( 'layout types', () => {
		it( 'regular: with default layout options', () => {
			const form: Form = {
				layout: { type: 'regular' },
				fields: [ 'field1' ],
			};
			const result = normalizeForm( form );
			expect( result ).toEqual( {
				layout: { labelPosition: 'top', type: 'regular' },
				fields: [
					{
						id: 'field1',
						layout: {
							type: 'regular',
							labelPosition: 'top',
						},
					},
				],
			} );
		} );

		it( 'regular: with layout options', () => {
			const form: Form = {
				layout: { type: 'regular', labelPosition: 'side' },
				fields: [ 'field1' ],
			};
			const result = normalizeForm( form );
			expect( result ).toEqual( {
				layout: { labelPosition: 'side', type: 'regular' },
				fields: [
					{
						id: 'field1',
						layout: {
							type: 'regular',
							labelPosition: 'side',
						},
					},
				],
			} );
		} );

		it( 'panel: with default layout options', () => {
			const form: Form = {
				layout: { type: 'panel' },
				fields: [ 'field1' ],
			};
			const result = normalizeForm( form );
			expect( result ).toEqual( {
				layout: {
					labelPosition: 'side',
					type: 'panel',
					openAs: 'dropdown',
					summary: [],
				},
				fields: [
					{
						id: 'field1',
						layout: {
							type: 'panel',
							labelPosition: 'side',
							openAs: 'dropdown',
							summary: [],
						},
					},
				],
			} );
		} );

		it( 'panel: with layout options', () => {
			const form: Form = {
				layout: { type: 'panel', labelPosition: 'top' },
				fields: [ 'field1' ],
			};
			const result = normalizeForm( form );
			expect( result ).toEqual( {
				layout: {
					labelPosition: 'top',
					type: 'panel',
					openAs: 'dropdown',
					summary: [],
				},
				fields: [
					{
						id: 'field1',
						layout: {
							type: 'panel',
							labelPosition: 'top',
							openAs: 'dropdown',
							summary: [],
						},
					},
				],
			} );
		} );

		it( 'card: with default layout options', () => {
			const form: Form = {
				layout: { type: 'card' },
				fields: [ 'field1' ],
			};
			const result = normalizeForm( form );
			expect( result ).toEqual( {
				layout: {
					type: 'card',
					isCollapsible: true,
					isOpened: true,
					summary: [],
					withHeader: true,
				},
				fields: [
					{
						id: 'field1',
						layout: {
							type: 'card',
							withHeader: true,
							isOpened: true,
							summary: [],
							isCollapsible: true,
						},
					},
				],
			} );
		} );

		it( 'card: enforces isOpened=true and summary=[] when withHeader=false', () => {
			const form: Form = {
				// @ts-ignore - Test intentionally uses invalid type to verify runtime behavior.
				layout: {
					type: 'card',
					withHeader: false,
					// @ts-ignore - Test intentionally uses invalid type to verify runtime behavior.
					isOpened: false,
					summary: [ { id: 'field1', visibility: 'always' } ],
				},
				fields: [ 'field1' ],
			};
			const result = normalizeForm( form );
			expect( result ).toEqual( {
				layout: {
					type: 'card',
					isCollapsible: false,
					withHeader: false,
					isOpened: true,
					summary: [],
				},
				fields: [
					{
						id: 'field1',
						layout: {
							type: 'card',
							withHeader: false,
							isOpened: true,
							summary: [],
							isCollapsible: false,
						},
					},
				],
			} );
		} );

		it( 'card: respects isOpened and summary when withHeader=true', () => {
			const form: Form = {
				layout: {
					type: 'card',
					withHeader: true,
					isOpened: false,
					summary: [ { id: 'field1', visibility: 'always' } ],
				},
				fields: [ 'field1' ],
			};
			const result = normalizeForm( form );
			expect( result ).toEqual( {
				layout: {
					type: 'card',
					isCollapsible: true,
					withHeader: true,
					isOpened: false,
					summary: [ { id: 'field1', visibility: 'always' } ],
				},
				fields: [
					{
						id: 'field1',
						layout: {
							type: 'card',
							withHeader: true,
							isOpened: false,
							summary: [ { id: 'field1', visibility: 'always' } ],
							isCollapsible: true,
						},
					},
				],
			} );
		} );

		it( 'card: normalizes summary to array of objects when it is a string', () => {
			const form: Form = {
				layout: {
					type: 'card',
					withHeader: true,
					isOpened: false,
					summary: [
						'field2',
						{ id: 'field1', visibility: 'always' },
					],
					isCollapsible: true,
				},
				fields: [ 'field1' ],
			};
			const result = normalizeForm( form );
			expect( result ).toEqual( {
				layout: {
					type: 'card',
					withHeader: true,
					isOpened: false,
					summary: [
						{ id: 'field2', visibility: 'when-collapsed' },
						{ id: 'field1', visibility: 'always' },
					],
					isCollapsible: true,
				},
				fields: [
					{
						id: 'field1',
						layout: {
							type: 'card',
							withHeader: true,
							isOpened: false,
							summary: [
								{ id: 'field2', visibility: 'when-collapsed' },
								{ id: 'field1', visibility: 'always' },
							],
							isCollapsible: true,
						},
					},
				],
			} );
		} );
	} );

	describe( 'layout overrides', () => {
		it( 'fields can override form layout', () => {
			const form: Form = {
				layout: { type: 'regular', labelPosition: 'top' },
				fields: [
					'field1',
					{
						id: 'field2',
						layout: { type: 'panel', labelPosition: 'side' },
					},
				],
			};
			const result = normalizeForm( form );
			expect( result ).toEqual( {
				layout: {
					type: 'regular',
					labelPosition: 'top',
				},
				fields: [
					{
						id: 'field1',
						layout: {
							type: 'regular',
							labelPosition: 'top',
						},
					},
					{
						id: 'field2',
						layout: {
							type: 'panel',
							labelPosition: 'side',
							openAs: 'dropdown',
							summary: [],
						},
					},
				],
			} );
		} );

		it( 'fields do not partially override form layout', () => {
			const form: Form = {
				layout: { type: 'card', withHeader: false, isOpened: true },
				fields: [
					'field1',
					{
						id: 'field2',
						layout: { type: 'card', isOpened: false },
					},
				],
			};
			const result = normalizeForm( form );
			expect( result ).toEqual( {
				layout: {
					type: 'card',
					isCollapsible: false,
					withHeader: false,
					isOpened: true,
					summary: [],
				},
				fields: [
					{
						id: 'field1',
						layout: {
							type: 'card',
							withHeader: false,
							isOpened: true,
							summary: [],
							isCollapsible: false,
						},
					},
					{
						id: 'field2',
						layout: {
							type: 'card',
							isCollapsible: true,
							withHeader: true,
							isOpened: false,
							summary: [],
						},
					},
				],
			} );
		} );
	} );

	describe( 'nested fields', () => {
		it( 'with same ID are supported', () => {
			const REGULAR = {
				type: 'regular',
				labelPosition: 'top',
			};
			const form: Form = {
				fields: [
					'field1',
					{
						id: 'field2',
						children: [ 'field2', 'field3' ],
					},
				],
			};
			const result = normalizeForm( form );
			expect( result ).toStrictEqual( {
				layout: { type: 'regular', labelPosition: 'top' },
				fields: [
					{
						id: 'field1',
						layout: REGULAR,
					},
					{
						id: 'field2',
						layout: REGULAR,
						children: [
							{ id: 'field2', layout: REGULAR },
							{ id: 'field3', layout: REGULAR },
						],
					},
				],
			} );
		} );

		it( 'are normalized at any level', () => {
			const REGULAR = {
				type: 'regular',
				labelPosition: 'top',
			};
			const form: Form = {
				fields: [
					'field1',
					{
						id: 'field2',
						children: [
							'field3',
							{
								id: 'field4',
								children: [
									'field5',
									{
										id: 'field6',
										children: [
											'field7',
											{
												id: 'field8',
												children: [ 'field9' ],
											},
										],
									},
								],
							},
						],
					},
				],
			};
			const result = normalizeForm( form );
			expect( result ).toStrictEqual( {
				layout: { type: 'regular', labelPosition: 'top' },
				fields: [
					{
						id: 'field1',
						layout: REGULAR,
					},
					{
						id: 'field2',
						layout: REGULAR,
						children: [
							{ id: 'field3', layout: REGULAR },
							{
								id: 'field4',
								layout: REGULAR,
								children: [
									{ id: 'field5', layout: REGULAR },
									{
										id: 'field6',
										layout: REGULAR,
										children: [
											{ id: 'field7', layout: REGULAR },
											{
												id: 'field8',
												layout: REGULAR,
												children: [
													{
														id: 'field9',
														layout: REGULAR,
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			} );
		} );

		it( 'layout is only prefilled for top-level fields', () => {
			const REGULAR = {
				type: 'regular',
				labelPosition: 'top',
			};
			const CARD = {
				type: 'card',
				withHeader: true,
				isCollapsible: true,
				isOpened: true,
				summary: [],
			};
			const form: Form = {
				layout: { type: 'card' },
				fields: [
					'field1',
					{
						id: 'field2',
						children: [ 'field3', 'field4' ],
					},
				],
			};
			const result = normalizeForm( form );
			expect( result ).toStrictEqual( {
				layout: CARD,
				fields: [
					{
						id: 'field1',
						layout: CARD,
					},
					{
						id: 'field2',
						layout: CARD,
						children: [
							{ id: 'field3', layout: REGULAR },
							{
								id: 'field4',
								layout: REGULAR,
							},
						],
					},
				],
			} );
		} );
	} );
} );
