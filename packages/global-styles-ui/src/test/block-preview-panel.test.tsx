/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { BlockPreview } from '@wordpress/block-editor';
import { __unstableGeneratePreviewStateStyles as generatePreviewStateStyles } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import BlockPreviewPanel from '../block-preview-panel';

jest.mock( '@wordpress/block-editor', () => ( {
	BlockPreview: jest.fn( () => null ),
} ) );

const mockBlockExample = {
	attributes: {},
	viewportWidth: 500,
};

jest.mock( '@wordpress/blocks', () => ( {
	getBlockType: jest.fn( () => ( {
		example: mockBlockExample,
	} ) ),
	getBlockFromExample: jest.fn( ( name, example ) => [
		{
			name,
			attributes: example.attributes,
		},
	] ),
} ) );

jest.mock( '@wordpress/components', () => ( {
	__experimentalSpacer: ( { children }: { children: ReactNode } ) => children,
} ) );

jest.mock( '@wordpress/global-styles-engine', () => ( {
	__unstableGeneratePreviewStateStyles: jest.fn(
		() => '.wp-block-test { color: red; }'
	),
} ) );

describe( 'BlockPreviewPanel', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it.each( [
		[ 'default', 783 ],
		[ 'tablet', 600 ],
		[ 'mobile', 480 ],
	] )(
		'passes %s viewport width to BlockPreview',
		( selectedViewport, width ) => {
			render(
				<BlockPreviewPanel
					name="core/test"
					selectedViewport={ selectedViewport }
				/>
			);

			expect( BlockPreview ).toHaveBeenCalledWith(
				expect.objectContaining( {
					viewportWidth: width,
				} ),
				{}
			);
		}
	);

	it( 'falls back to the block example width for unknown viewports', () => {
		render(
			<BlockPreviewPanel name="core/test" selectedViewport="unknown" />
		);

		expect( BlockPreview ).toHaveBeenCalledWith(
			expect.objectContaining( {
				viewportWidth: mockBlockExample.viewportWidth,
			} ),
			{}
		);
	} );

	it( 'injects generated preview styles for selected states', () => {
		const stateStyles = { color: { text: 'red' } };

		render(
			<BlockPreviewPanel
				name="core/test"
				selectedState="mobile"
				stateStyles={ stateStyles }
			/>
		);

		expect( generatePreviewStateStyles ).toHaveBeenCalledWith(
			stateStyles,
			'core/test'
		);
		expect( BlockPreview ).toHaveBeenCalledWith(
			expect.objectContaining( {
				additionalStyles: [
					expect.objectContaining( {
						css: expect.stringContaining(
							'.wp-block-test { color: red; }'
						),
					} ),
				],
			} ),
			{}
		);
	} );
} );
