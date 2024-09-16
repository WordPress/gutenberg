/**
 * WordPress dependencies
 */
import { addFilter, removeFilter } from '@wordpress/hooks';

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

	afterEach( () => {
		removeFilter( 'blocks.registerBlockType', 'test/filterSupports' );
	} );

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

	it( 'should reapply transformations after supports are filtered', () => {
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

		addFilter(
			'blocks.registerBlockType',
			'test/filterSupports',
			( settings, name ) => {
				if ( name === 'test/block' && settings.supports.typography ) {
					settings.supports.typography.__experimentalFontFamily = false;
					settings.supports.typography.__experimentalFontStyle = false;
					settings.supports.typography.__experimentalFontWeight = false;
				}
				return settings;
			}
		);

		const processedBlockType = processBlockType(
			'test/block',
			blockSettings
		)( { select } );

		expect( processedBlockType.supports.typography ).toEqual( {
			fontSize: true,
			lineHeight: true,
			fontFamily: false,
			fontStyle: false,
			fontWeight: false,
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

	it( 'should reapply transformations after supports are filtered within block deprecations', () => {
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

		addFilter(
			'blocks.registerBlockType',
			'test/filterSupports',
			( settings, name ) => {
				if ( name === 'test/block' && settings.supports.typography ) {
					settings.supports.typography.__experimentalFontFamily = false;
					settings.supports.typography.__experimentalFontStyle = false;
					settings.supports.typography.__experimentalFontWeight = false;
				}
				return settings;
			}
		);

		const processedBlockType = processBlockType(
			'test/block',
			blockSettings
		)( { select } );

		expect(
			processedBlockType.deprecated[ 0 ].supports.typography
		).toEqual( {
			fontFamily: false,
			fontStyle: false,
			fontWeight: false,
			letterSpacing: true,
			textTransform: true,
			textDecoration: true,
			__experimentalWritingMode: true,
		} );
	} );
} );
