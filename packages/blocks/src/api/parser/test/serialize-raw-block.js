/**
 * Internal dependencies
 */
import { serializeRawBlock } from '../serialize-raw-block';

describe( 'serializeRawBlock', () => {
	it( 'reserializes block nodes', () => {
		const expected = `<!-- wp:columns -->
			<div class="wp-block-columns has-2-columns">
				<!-- wp:column -->
				<div class="wp-block-column">
					<!-- wp:paragraph -->
					<p>A</p>
					<!-- /wp:paragraph -->
				</div>
				<!-- /wp:column -->
				<!-- wp:column -->
				<div class="wp-block-column">
					<!-- wp:group -->
					<div class="wp-block-group">
						<!-- wp:list -->
						<ul><li>B</li><li>C</li></ul>
						<!-- /wp:list -->
						<!-- wp:paragraph -->
						<p>D</p>
						<!-- /wp:paragraph -->
					</div>
					<!-- /wp:group -->
				</div>
				<!-- /wp:column -->
			</div>
			<!-- /wp:columns -->`.replace( /\t/g, '' );
		const input = {
			blockName: 'core/columns',
			attrs: {},
			innerBlocks: [
				{
					blockName: 'core/column',
					attrs: {},
					innerBlocks: [
						{
							blockName: 'core/paragraph',
							attrs: {},
							innerBlocks: [],
							innerHTML: '<p>A</p>',
							innerContent: [ '<p>A</p>' ],
						},
					],
					innerHTML: '<div class="wp-block-column"></div>',
					innerContent: [
						'<div class="wp-block-column">',
						null,
						'</div>',
					],
				},
				{
					blockName: 'core/column',
					attrs: {},
					innerBlocks: [
						{
							blockName: 'core/group',
							attrs: {},
							innerBlocks: [
								{
									blockName: 'core/list',
									attrs: {},
									innerBlocks: [],
									innerHTML: '<ul><li>B</li><li>C</li></ul>',
									innerContent: [
										'<ul><li>B</li><li>C</li></ul>',
									],
								},
								{
									blockName: 'core/paragraph',
									attrs: {},
									innerBlocks: [],
									innerHTML: '<p>D</p>',
									innerContent: [ '<p>D</p>' ],
								},
							],
							innerHTML: '<div class="wp-block-group"></div>',
							innerContent: [
								'<div class="wp-block-group">',
								null,
								'',
								null,
								'</div>',
							],
						},
					],
					innerHTML: '<div class="wp-block-column"></div>',
					innerContent: [
						'<div class="wp-block-column">',
						null,
						'</div>',
					],
				},
			],
			innerHTML: '<div class="wp-block-columns has-2-columns"></div>',
			innerContent: [
				'<div class="wp-block-columns has-2-columns">',
				null,
				'',
				null,
				'</div>',
			],
		};
		const actual = serializeRawBlock( input );

		expect( actual ).toEqual( expected );
	} );
} );
