import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import { LayoutStyle } from '../layout';
import { useSettings } from '../../use-settings';

vi.mock( import( '../../use-settings' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSettings: vi.fn(),
} ) );

describe( 'LayoutStyle', () => {
	const props = {
		layout: { type: 'flex' },
		style: { spacing: { blockGap: '10px' } },
		selector: '.my-container',
		blockName: 'test/block',
	};

	it.each( [ null, undefined ] )(
		'outputs no layout styles when the block gap setting is %s',
		( blockGapSetting ) => {
			useSettings.mockReturnValue( [ blockGapSetting ] );

			const { container } = render( createElement( LayoutStyle, props ) );

			expect( container ).toBeEmptyDOMElement();
		}
	);

	it( 'outputs block gap styles when the theme opts into block gap', () => {
		useSettings.mockReturnValue( [ true ] );

		const { container } = render( createElement( LayoutStyle, props ) );

		expect( container.innerHTML ).toContain(
			'.my-container { gap: 10px; }'
		);
	} );
} );
