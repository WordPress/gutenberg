/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { cx as innerCx } from '@emotion/css';
import { insertStyles } from '@emotion/utils';
import { render } from '@testing-library/react';
import { css, CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

/**
 * Internal dependencies
 */
import { useCx } from '..';

jest.mock( '@emotion/css', () => ( {
	cx: jest.fn(),
} ) );

jest.mock( '@emotion/utils', () => ( {
	insertStyles: jest.fn(),
} ) );

function Example( { args } ) {
	const cx = useCx();

	return <div className={ cx( ...args ) } />;
}

describe( 'useCx', () => {
	it( 'should call cx with the built style name and pass serialized styles to insertStyles', () => {
		const serializedStyle = css`
			color: red;
		`;
		const className = 'component-example';
		const object = {
			'component-example-focused': true,
		};

		const key = 'test-cache-key';

		const container = document.createElement( 'head' );

		const cache = createCache( { container, key } );

		render(
			<CacheProvider value={ cache }>
				<Example args={ [ className, serializedStyle, object ] } />
			</CacheProvider>
		);

		expect( innerCx ).toHaveBeenCalledWith(
			className,
			`${ key }-${ serializedStyle.name }`,
			object
		);

		expect( insertStyles ).toHaveBeenCalledWith(
			cache,
			serializedStyle,
			false
		);
	} );
} );
