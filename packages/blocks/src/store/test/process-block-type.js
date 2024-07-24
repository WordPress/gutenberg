/**
 * Internal dependencies
 */
import { processBlockType } from '../process-block-type';

describe( 'processBlockType', () => {
	const baseBlockSettings = {
		apiVersion: 3,
		attributes: {},
		edit: () => null,
		name: 'test/block',
		save: () => null,
		title: 'Test Block',
	};

	const select = {
		getBootstrappedBlockType: () => null,
	};

	it( 'should return the block type with stabilized typography supports', () => {
		const blockSettings = {
			...baseBlockSettings,
			supports: {
				typography: {
					fontSize: true,
					lineHeight: true,
					__experimentalFontFamily: true,
					__experimentalFontStyle: true,
					__experimentalFontWeight: true,
					__experimentalLetterSpacing: true,
					__experimentalTextTransform: true,
					__experimentalTextDecoration: true,
					__experimentalWritingMode: true,
					__experimentalDefaultControls: {
						fontSize: true,
						fontAppearance: true,
						textTransform: true,
					},
				},
			},
		};

		const processedBlockType = processBlockType(
			'test/block',
			blockSettings
		)( { select } );

		expect( processedBlockType.supports.typography ).toEqual( {
			fontSize: true,
			lineHeight: true,
			fontFamily: true,
			fontStyle: true,
			fontWeight: true,
			letterSpacing: true,
			textTransform: true,
			textDecoration: true,
			__experimentalWritingMode: true,
			__experimentalDefaultControls: {
				fontSize: true,
				fontAppearance: true,
				textTransform: true,
			},
		} );
	} );

	it( 'should return the block type with stable typography supports', () => {
		const blockSettings = {
			...baseBlockSettings,
			supports: {
				typography: {
					fontSize: true,
					lineHeight: true,
					fontFamily: true,
					fontStyle: true,
					fontWeight: true,
					letterSpacing: true,
					textTransform: true,
					textDecoration: true,
					__experimentalWritingMode: true,
					__experimentalDefaultControls: {
						fontSize: true,
						fontAppearance: true,
						textTransform: true,
					},
				},
			},
		};

		const processedBlockType = processBlockType(
			'test/block',
			blockSettings
		)( { select } );

		expect( processedBlockType.supports.typography ).toEqual( {
			fontSize: true,
			lineHeight: true,
			fontFamily: true,
			fontStyle: true,
			fontWeight: true,
			letterSpacing: true,
			textTransform: true,
			textDecoration: true,
			__experimentalWritingMode: true,
			__experimentalDefaultControls: {
				fontSize: true,
				fontAppearance: true,
				textTransform: true,
			},
		} );
	} );

	it( 'should stabilize experimental typography supports within block deprecations', () => {
		const blockSettings = {
			...baseBlockSettings,
			supports: {
				typography: {
					fontSize: true,
					lineHeight: true,
					fontFamily: true,
					fontStyle: true,
					fontWeight: true,
					letterSpacing: true,
					textTransform: true,
					textDecoration: true,
					__experimentalWritingMode: true,
					__experimentalDefaultControls: {
						fontSize: true,
						fontAppearance: true,
						textTransform: true,
					},
				},
			},
			deprecated: [
				{
					supports: {
						typography: {
							__experimentalFontFamily: true,
							__experimentalFontStyle: true,
							__experimentalFontWeight: true,
							__experimentalLetterSpacing: true,
							__experimentalTextTransform: true,
							__experimentalTextDecoration: true,
							__experimentalWritingMode: true,
						},
					},
				},
			],
		};

		const processedBlockType = processBlockType(
			'test/block',
			blockSettings
		)( { select } );

		expect(
			processedBlockType.deprecated[ 0 ].supports.typography
		).toEqual( {
			fontFamily: true,
			fontStyle: true,
			fontWeight: true,
			letterSpacing: true,
			textTransform: true,
			textDecoration: true,
			__experimentalWritingMode: true,
		} );
	} );
} );
