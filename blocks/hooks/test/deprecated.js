/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { createElement, RawHTML } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	RawHTMLWithWarning,
	shimRawHTML,
	shimReactSource,
	shimReplaceReplaceReactAttributes,
} from '../deprecated';
import { withRegisteredBlockType } from '../../test/helpers';

describe( 'deprecated', () => {
	describe( 'RawHTMLWithWarning', () => {
		it( 'warns on mount', () => {
			shallow( <RawHTMLWithWarning /> );

			expect( console ).toHaveWarned();
		} );

		it( 'renders RawHTML', () => {
			const wrapper = shallow(
				<RawHTMLWithWarning>
					Scary!
				</RawHTMLWithWarning>
			);

			expect( console ).toHaveWarned();
			expect( wrapper.name() ).toBe( 'RawHTML' );
			expect( wrapper.find( 'RawHTML' ).prop( 'children' ) ).toBe( 'Scary!' );
		} );
	} );

	describe( 'shimRawHTML()', () => {
		it( 'should do nothing to elements', () => {
			const original = createElement( 'div' );
			const result = shimRawHTML( original );

			expect( result ).toBe( original );
		} );

		it( 'should do nothing to non-HTML strings', () => {
			const original = 'Not so scary';
			const result = shimRawHTML( original );

			expect( result ).toBe( original );
		} );

		it( 'replace HTML strings with RawHTMLWithWarning', () => {
			const original = '<p>So scary!</p>';
			const result = shimRawHTML( original );

			expect( result.type ).toBe( RawHTMLWithWarning );
			expect( result.props.children ).toBe( original );
		} );

		it( 'replace shortcode strings with RawHTMLWithWarning', () => {
			const original = '[myshortcode]Hello[/myshortcode]';
			const result = shimRawHTML( original );

			expect( result.type ).toBe( RawHTMLWithWarning );
			expect( result.props.children ).toBe( original );
		} );
	} );

	describe( 'shimReactSource()', () => {
		describe( 'no default', () => {
			it( 'replaces children configuration', () => {
				const blockType = shimReactSource( {
					attributes: {
						content: {
							type: 'array',
							source: 'children',
							selector: 'div',
						},
					},
				} );

				expect( blockType ).toEqual( {
					_compatReactSource: true,
					attributes: {
						content: {
							type: 'string',
							source: 'html',
							selector: 'div',
							_deprecated: 'children',
						},
					},
				} );
			} );

			it( 'replaces node configuration', () => {
				const blockType = shimReactSource( {
					attributes: {
						content: {
							type: 'object',
							source: 'node',
							selector: 'div',
						},
					},
				} );

				expect( blockType ).toEqual( {
					_compatReactSource: true,
					attributes: {
						content: {
							type: 'string',
							source: 'property',
							selector: 'div',
							property: 'outerHTML',
							_deprecated: 'node',
						},
					},
				} );
			} );
		} );

		describe( 'simple default', () => {
			it( 'replaces children configuration', () => {
				const blockType = shimReactSource( {
					attributes: {
						content: {
							type: 'array',
							source: 'children',
							selector: 'div',
							default: [],
						},
					},
				} );

				expect( blockType ).toEqual( {
					_compatReactSource: true,
					attributes: {
						content: {
							type: 'string',
							source: 'html',
							selector: 'div',
							default: '',
							_deprecated: 'children',
						},
					},
				} );
			} );
		} );

		describe( 'complex default', () => {
			it( 'replaces children configuration', () => {
				const blockType = shimReactSource( {
					attributes: {
						content: {
							type: 'array',
							source: 'children',
							selector: 'table',
							default: [
								<tbody key="1">
									<tr><td><br /></td></tr>
								</tbody>,
								<tfoot key="2"></tfoot>,
							],
						},
					},
				} );

				expect( blockType ).toEqual( {
					_compatReactSource: true,
					attributes: {
						content: {
							type: 'string',
							source: 'html',
							selector: 'table',
							default: '<tbody><tr><td><br/></td></tr></tbody><tfoot></tfoot>',
							_deprecated: 'children',
						},
					},
				} );
			} );
		} );

		it( 'replaces multiple children configuration', () => {
			const blockType = shimReactSource( {
				attributes: {
					content1: {
						type: 'array',
						source: 'children',
						selector: 'div',
					},
					content2: {
						type: 'array',
						source: 'children',
						selector: 'footer',
					},
				},
			} );

			expect( blockType ).toEqual( {
				_compatReactSource: true,
				attributes: {
					content1: {
						type: 'string',
						source: 'html',
						selector: 'div',
						_deprecated: 'children',
					},
					content2: {
						type: 'string',
						source: 'html',
						selector: 'footer',
						_deprecated: 'children',
					},
				},
			} );
		} );

		it( 'replaces query-nested children configuration', () => {
			const blockType = shimReactSource( {
				attributes: {
					contents: {
						type: 'array',
						source: 'query',
						selector: 'div',
						query: {
							content: {
								source: 'children',
								selector: 'div',
							},
						},
					},
				},
			} );

			expect( blockType ).toEqual( {
				_compatReactSource: true,
				attributes: {
					contents: {
						type: 'array',
						source: 'query',
						selector: 'div',
						query: {
							content: {
								source: 'html',
								selector: 'div',
								_deprecated: 'children',
							},
						},
					},
				},
			} );
		} );

		it( 'replaces deprecated children configuration', () => {
			const blockType = shimReactSource( {
				attributes: {},
				deprecated: [
					{
						attributes: {
							content: {
								type: 'array',
								source: 'children',
								selector: 'div',
							},
						},
					},
				],
			} );

			expect( blockType ).toEqual( {
				attributes: {},
				deprecated: [
					{
						_compatReactSource: true,
						attributes: {
							content: {
								type: 'string',
								source: 'html',
								selector: 'div',
								_deprecated: 'children',
							},
						},
					},
				],
			} );
		} );
	} );

	describe( 'shimReplaceReplaceReactAttributes', () => {
		describe( 'isToReact = true', () => {
			withRegisteredBlockType( 'core/test-block', {
				_compatReactSource: true,
				attributes: {
					content: {
						type: 'string',
						source: 'html',
						selector: 'p',
						default: '',
					},
				},
			} )( () => {
				it( 'should not replace string source if not compat', () => {
					const attributes = shimReplaceReplaceReactAttributes( true, {
						content: '',
					}, 'core/test-block' );

					expect( attributes ).toEqual( {
						content: '',
					} );
				} );
			} );

			withRegisteredBlockType( 'core/test-block', {
				_compatReactSource: true,
				attributes: {
					content: {
						type: 'string',
						source: 'html',
						selector: 'p',
						default: '',
						_deprecated: 'children',
					},
				},
			} )( () => {
				it( 'should replace empty string defaulted', () => {
					const attributes = shimReplaceReplaceReactAttributes( true, {
						content: '',
					}, 'core/test-block' );

					expect( attributes ).toEqual( {
						content: [],
					} );
				} );

				it( 'should replace non-empty string', () => {
					const attributes = shimReplaceReplaceReactAttributes( true, {
						content: '<em>Chicken</em>',
					}, 'core/test-block' );

					expect( attributes ).toEqual( {
						content: [
							<RawHTML key="children">{ '<em>Chicken</em>' }</RawHTML>,
						],
					} );
				} );
			} );

			withRegisteredBlockType( 'core/test-block', {
				_compatReactSource: true,
				attributes: {
					contents: {
						type: 'array',
						source: 'query',
						selector: 'div',
						query: {
							content: {
								source: 'html',
								selector: 'div',
								_deprecated: 'children',
							},
						},
					},
				},
			} )( () => {
				it( 'replaces query-nested strings', () => {
					const attributes = shimReplaceReplaceReactAttributes( true, {
						contents: [
							{ content: '<em>Chicken</em>' },
							{ content: '<em>Ribs</em>' },
						],
					}, 'core/test-block' );

					expect( attributes ).toEqual( {
						contents: [
							{ content: [ <RawHTML key="children">{ '<em>Chicken</em>' }</RawHTML> ] },
							{ content: [ <RawHTML key="children">{ '<em>Ribs</em>' }</RawHTML> ] },
						],
					} );
				} );
			} );
		} );

		describe( 'isToReact = false', () => {
			withRegisteredBlockType( 'core/test-block', {
				_compatReactSource: true,
				attributes: {
					content: {
						type: 'string',
						source: 'html',
						selector: 'p',
						default: '',
						_deprecated: 'children',
					},
				},
			} )( () => {
				it( 'should not replace string value', () => {
					const attributes = shimReplaceReplaceReactAttributes( false, {
						content: '<p>Leave me be</p>',
					}, 'core/test-block' );

					expect( attributes ).toEqual( {
						content: '<p>Leave me be</p>',
					} );
				} );

				it( 'should replace React element', () => {
					const attributes = shimReplaceReplaceReactAttributes( false, {
						content: <em>Chicken</em>,
					}, 'core/test-block' );

					expect( attributes ).toEqual( {
						content: '<em>Chicken</em>',
					} );
				} );
			} );
		} );
	} );
} );
