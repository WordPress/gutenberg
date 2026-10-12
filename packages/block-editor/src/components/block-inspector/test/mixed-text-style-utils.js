import { describe, expect, test } from 'vitest';
import {
	applySharedStyleAttributeChanges,
	createBlockStyleSettings,
	getContentOnlySectionClientIds,
	getCommonStyleSettings,
	getCommonSupportedStyles,
	getExpandedTextStyleTargetClientIds,
	getSharedStyleAttributeChanges,
	getSharedStylePaths,
	getSharedStyleSettings,
	getTextStyleTargetClientIds,
} from '../mixed-text-style-utils';

const paragraph = {
	name: 'core/paragraph',
	category: 'text',
	supports: {
		color: { text: true },
		spacing: { padding: true },
		typography: { fitText: true, fontSize: true, textShadow: true },
	},
};
const heading = {
	name: 'core/heading',
	category: 'text',
	supports: {
		color: { text: true },
		spacing: { padding: true },
		typography: { fitText: true, fontSize: true, textShadow: true },
	},
};
const code = {
	name: 'core/code',
	category: 'text',
	supports: {
		typography: { fontSize: true },
	},
};

const customTextShadow = '1px 1px 2px #000';

describe( 'mixed text style utilities', () => {
	test( 'selects only registered text-category targets in document order', () => {
		const blockNames = {
			heading: 'core/heading',
			image: 'core/image',
			missing: 'test/missing',
			paragraph: 'core/paragraph',
		};
		const blockTypes = {
			'core/heading': heading,
			'core/image': { name: 'core/image', category: 'media' },
			'core/paragraph': paragraph,
		};

		expect(
			getTextStyleTargetClientIds(
				[ 'image', 'paragraph', 'missing', 'heading' ],
				( clientId ) => blockNames[ clientId ],
				( blockName ) => blockTypes[ blockName ]
			)
		).toEqual( [ 'paragraph', 'heading' ] );
	} );

	test( 'keeps the first document-order text target as the source', () => {
		const blockNames = {
			heading: 'core/heading',
			image: 'core/image',
			paragraph: 'core/paragraph',
		};
		const blockTypes = {
			'core/heading': heading,
			'core/image': { name: 'core/image', category: 'media' },
			'core/paragraph': paragraph,
		};
		const getTargets = ( documentOrderedClientIds ) =>
			getTextStyleTargetClientIds(
				documentOrderedClientIds,
				( clientId ) => blockNames[ clientId ],
				( blockName ) => blockTypes[ blockName ]
			);

		expect( getTargets( [ 'image', 'paragraph', 'heading' ] )[ 0 ] ).toBe(
			'paragraph'
		);
		expect( getTargets( [ 'paragraph', 'heading', 'image' ] )[ 0 ] ).toBe(
			'paragraph'
		);
	} );

	test( 'includes represented text descendants from every selected section', () => {
		const descendants = {
			'first-section': [
				'paragraph',
				'list',
				'list-item',
				'list-item-paragraph',
			],
			list: [ 'list-item', 'list-item-paragraph' ],
			'second-section': [ 'heading' ],
		};
		const blockNames = {
			heading: 'core/heading',
			list: 'core/list',
			paragraph: 'core/paragraph',
			standalone: 'core/paragraph',
		};
		const blockTypes = {
			'core/heading': heading,
			'core/list': { name: 'core/list', category: 'text' },
			'core/paragraph': paragraph,
		};
		const representedClientIds = getContentOnlySectionClientIds(
			[ 'first-section', 'second-section' ],
			( clientId ) => descendants[ clientId ] || [],
			() => 'contentOnly',
			( clientId ) => clientId === 'list'
		);

		expect( representedClientIds ).toEqual( [
			'paragraph',
			'list',
			'heading',
		] );
		expect(
			getExpandedTextStyleTargetClientIds(
				[ 'first-section', 'standalone', 'second-section' ],
				[ 'first-section', 'second-section' ],
				( sectionClientId ) =>
					getContentOnlySectionClientIds(
						[ sectionClientId ],
						( clientId ) => descendants[ clientId ] || [],
						() => 'contentOnly',
						( clientId ) => clientId === 'list'
					),
				( clientId ) => blockNames[ clientId ],
				( blockName ) => blockTypes[ blockName ]
			)
		).toEqual( [ 'paragraph', 'list', 'standalone', 'heading' ] );
	} );

	test( 'intersects style support and disables source-only settings', () => {
		const commonSupportedStyles = getCommonSupportedStyles( [
			[ 'fontSize', 'textIndent', 'color' ],
			[ 'color', 'fontSize' ],
		] );
		const settings = getSharedStyleSettings(
			{
				color: { text: true },
				typography: {
					fontSizes: { theme: [ { slug: 'large', size: '2rem' } ] },
					textIndent: true,
				},
			},
			commonSupportedStyles,
			[ paragraph, heading ]
		);

		expect( commonSupportedStyles ).toEqual( [ 'fontSize', 'color' ] );
		expect( settings.typography.textIndent ).toBe( false );
		expect( settings.typography.fontSizes.theme ).toHaveLength( 1 );
		expect( settings.color.text ).toBe( true );
	} );

	test.each( [
		[ 'Paragraph then Code', [ paragraph, code ] ],
		[ 'Code then Paragraph', [ code, paragraph ] ],
	] )( 'disables text shadow for %s', ( _, blockTypes ) => {
		const commonSupportedStyles = getCommonSupportedStyles(
			blockTypes.map( ( blockType ) =>
				blockType.supports.typography.textShadow
					? [ 'fontSize', 'textShadow' ]
					: [ 'fontSize' ]
			)
		);
		const settings = getSharedStyleSettings(
			{ typography: { textShadow: true } },
			commonSupportedStyles,
			blockTypes
		);

		expect( settings.typography.textShadow ).toBe( false );
	} );

	test.each( [ true, false ] )(
		'preserves the text shadow setting %s when every target supports it',
		( textShadow ) => {
			const settings = getSharedStyleSettings(
				{ typography: { textShadow } },
				[ 'textShadow' ],
				[ paragraph, heading ]
			);

			expect( settings.typography.textShadow ).toBe( textShadow );
		}
	);

	test( 'intersects settings resolved for every target instance', () => {
		const sourceSettings = {
			color: {
				custom: true,
				palette: {
					theme: [
						{ color: '#f00', slug: 'red' },
						{ color: '#00f', slug: 'blue' },
					],
				},
			},
			spacing: {
				padding: { sides: [ 'top', 'bottom' ] },
			},
			typography: {
				customFontSize: true,
				fontSizes: {
					theme: [
						{ size: '1rem', slug: 'small' },
						{ size: '2rem', slug: 'large' },
					],
				},
			},
		};
		const settingsByTarget = [
			createBlockStyleSettings(
				[
					'color.custom',
					'color.palette.theme',
					'spacing.padding',
					'typography.customFontSize',
					'typography.fontSizes.theme',
				],
				[
					true,
					sourceSettings.color.palette.theme,
					true,
					true,
					sourceSettings.typography.fontSizes.theme,
				]
			),
			createBlockStyleSettings(
				[
					'color.custom',
					'color.palette.theme',
					'spacing.padding',
					'typography.customFontSize',
					'typography.fontSizes.theme',
				],
				[
					false,
					[ { color: '#f00', slug: 'red' } ],
					true,
					false,
					[ { size: '1rem', slug: 'small' } ],
				]
			),
		];

		expect(
			getCommonStyleSettings( sourceSettings, settingsByTarget )
		).toEqual( {
			color: {
				custom: false,
				palette: {
					theme: [ { color: '#f00', slug: 'red' } ],
				},
			},
			spacing: {
				padding: { sides: [ 'top', 'bottom' ] },
			},
			typography: {
				customFontSize: false,
				fontSizes: {
					theme: [ { size: '1rem', slug: 'small' } ],
				},
			},
		} );
	} );

	test( 'keeps gradient settings only for shared gradient support', () => {
		const settings = getSharedStyleSettings(
			{
				background: { gradient: true },
				color: {
					background: true,
					customGradient: true,
					gradients: {
						theme: [ { gradient: 'linear-gradient(#000, #fff)' } ],
					},
				},
			},
			[ 'backgroundGradient' ],
			[ paragraph, heading ]
		);

		expect( settings.background.gradient ).toBe( true );
		expect( settings.color.background ).toBe( false );
		expect( settings.color.customGradient ).toBe( true );
		expect( settings.color.gradients.theme ).toHaveLength( 1 );
	} );

	test( 'keeps the legacy background-gradient control when every text target supports it', () => {
		const settings = getSharedStyleSettings(
			{
				color: {
					background: true,
					customGradient: true,
					gradients: {
						theme: [ { gradient: 'linear-gradient(#000, #fff)' } ],
					},
				},
			},
			[ 'background' ],
			[ paragraph, heading ]
		);

		expect( settings.color.background ).toBe( true );
		expect( settings.color.customGradient ).toBe( true );
		expect( settings.color.gradients.theme ).toHaveLength( 1 );
	} );

	test( 'allows background position with shared background-size support', () => {
		const { stylePaths, attributeNames } = getSharedStylePaths(
			[ 'backgroundSize' ],
			[ paragraph, heading ]
		);
		const changes = getSharedStyleAttributeChanges(
			{
				style: {
					background: {
						backgroundPosition: '50% 50%',
						backgroundSize: 'cover',
					},
				},
			},
			{
				style: {
					background: {
						backgroundPosition: '0% 0%',
						backgroundSize: 'contain',
					},
				},
			},
			stylePaths,
			attributeNames
		);

		expect( changes.styleChanges ).toEqual( [
			{
				path: [ 'background', 'backgroundPosition' ],
				value: '0% 0%',
			},
			{
				path: [ 'background', 'backgroundSize' ],
				value: 'contain',
			},
		] );
	} );

	test( 'drops changes to unsupported style paths', () => {
		const { stylePaths, attributeNames } = getSharedStylePaths(
			[ 'fontSize' ],
			[ paragraph, heading ]
		);
		const changes = getSharedStyleAttributeChanges(
			{
				style: {
					border: { radius: '2px' },
					typography: { fontSize: '1rem' },
				},
			},
			{
				style: {
					border: { radius: '10px' },
					typography: { fontSize: '2rem' },
				},
			},
			stylePaths,
			attributeNames
		);

		expect( changes ).toEqual( {
			attributeChanges: { fontSize: undefined },
			styleChanges: [
				{ path: [ 'typography', 'fontSize' ], value: '2rem' },
			],
		} );
	} );

	test( 'represents resets as undefined shared-style changes', () => {
		const { stylePaths, attributeNames } = getSharedStylePaths(
			[ 'fontSize' ],
			[ paragraph, heading ]
		);
		const changes = getSharedStyleAttributeChanges(
			{
				fitText: true,
				fontSize: 'large',
				style: { typography: { fontSize: '2rem' } },
			},
			{},
			stylePaths,
			attributeNames
		);

		expect( changes ).toEqual( {
			attributeChanges: {
				fitText: undefined,
				fontSize: undefined,
			},
			styleChanges: [
				{ path: [ 'typography', 'fontSize' ], value: undefined },
			],
		} );
	} );

	test( 'deep-merges shared changes without removing target-only styles', () => {
		const changes = {
			attributeChanges: { fontSize: 'large' },
			styleChanges: [
				{
					path: [ 'typography', 'lineHeight' ],
					value: '1.8',
				},
			],
		};

		expect(
			applySharedStyleAttributeChanges(
				{
					style: {
						border: { radius: '4px' },
						color: { background: '#fff' },
						typography: {
							fontWeight: '700',
							lineHeight: '1.2',
						},
					},
				},
				changes
			)
		).toEqual( {
			fontSize: 'large',
			style: {
				border: { radius: '4px' },
				color: { background: '#fff' },
				typography: {
					fontWeight: '700',
					lineHeight: '1.8',
				},
			},
		} );
	} );

	test( 'clears a target custom font size and fit text when applying a preset', () => {
		const { stylePaths, attributeNames } = getSharedStylePaths(
			[ 'fontSize' ],
			[ paragraph, heading ]
		);
		const changes = getSharedStyleAttributeChanges(
			{},
			{ fontSize: 'large' },
			stylePaths,
			attributeNames
		);

		expect(
			applySharedStyleAttributeChanges(
				{
					fitText: true,
					style: { typography: { fontSize: '31px' } },
				},
				changes
			)
		).toEqual( {
			fitText: undefined,
			fontSize: 'large',
			style: undefined,
		} );
	} );

	test.each( [
		[
			'applies a preset',
			{},
			{ textShadow: 'natural' },
			'natural',
			undefined,
		],
		[
			'replaces a custom shadow with a preset',
			{ style: { typography: { textShadow: customTextShadow } } },
			{ textShadow: 'natural', style: undefined },
			'natural',
			undefined,
		],
		[
			'replaces a preset with a custom shadow',
			{ textShadow: 'natural' },
			{
				textShadow: undefined,
				style: { typography: { textShadow: customTextShadow } },
			},
			undefined,
			customTextShadow,
		],
		[
			'removes a preset',
			{ textShadow: 'natural' },
			{ textShadow: undefined },
			undefined,
			undefined,
		],
		[
			'removes a custom shadow',
			{ style: { typography: { textShadow: customTextShadow } } },
			{ style: undefined },
			undefined,
			undefined,
		],
	] )(
		'%s across different target representations',
		( _, sourceAttributes, nextAttributes, preset, custom ) => {
			const { stylePaths, attributeNames } = getSharedStylePaths(
				[ 'textShadow' ],
				[ paragraph, heading ]
			);
			const changes = getSharedStyleAttributeChanges(
				sourceAttributes,
				nextAttributes,
				stylePaths,
				attributeNames
			);
			const targets = [
				{},
				{ textShadow: 'deep' },
				{ style: { typography: { textShadow: '2px 2px 4px #f00' } } },
			];

			for ( const target of targets ) {
				const targetAttributes = {
					...target,
					fitText: true,
					style: {
						color: { text: '#111' },
						typography: {
							...target.style?.typography,
							lineHeight: '1.5',
						},
					},
				};
				const updatedAttributes = {
					...targetAttributes,
					...applySharedStyleAttributeChanges(
						targetAttributes,
						changes
					),
				};

				expect( updatedAttributes.textShadow ).toBe( preset );
				expect( updatedAttributes.style.typography.textShadow ).toBe(
					custom
				);
				expect( updatedAttributes.style.color ).toEqual( {
					text: '#111',
				} );
				expect( updatedAttributes.style.typography.lineHeight ).toBe(
					'1.5'
				);
				expect( updatedAttributes.fitText ).toBe( true );
			}
		}
	);

	test( 'preserves a target-specific link color when text color changes', () => {
		const { stylePaths, attributeNames } = getSharedStylePaths(
			[ 'color', 'linkColor' ],
			[ paragraph, heading ]
		);
		const blue = 'var:preset|color|blue';
		const changes = getSharedStyleAttributeChanges(
			{},
			{
				style: {
					elements: { link: { color: { text: blue } } },
				},
				textColor: 'blue',
			},
			stylePaths,
			attributeNames
		);
		const targetAttributes = {
			style: {
				color: { text: '#111' },
				elements: { link: { color: { text: '#f00' } } },
			},
		};

		expect(
			applySharedStyleAttributeChanges( targetAttributes, changes )
		).toEqual( {
			style: {
				elements: { link: { color: { text: '#f00' } } },
			},
			textColor: 'blue',
		} );
	} );

	test( 'updates a link color that was tracking the target text color', () => {
		const { stylePaths, attributeNames } = getSharedStylePaths(
			[ 'color', 'linkColor' ],
			[ paragraph, heading ]
		);
		const blue = 'var:preset|color|blue';
		const changes = getSharedStyleAttributeChanges(
			{},
			{
				style: {
					elements: { link: { color: { text: blue } } },
				},
				textColor: 'blue',
			},
			stylePaths,
			attributeNames
		);
		const targetAttributes = {
			style: {
				color: { text: '#111' },
				elements: { link: { color: { text: '#111' } } },
			},
		};

		expect(
			applySharedStyleAttributeChanges( targetAttributes, changes )
		).toEqual( {
			style: {
				elements: { link: { color: { text: blue } } },
			},
			textColor: 'blue',
		} );
	} );
} );
