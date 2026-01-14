/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Visual } from '../index';

describe( 'EmptyState.Visual', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLDivElement >();

		render(
			<Visual ref={ ref }>
				<svg />
			</Visual>
		);

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
	} );
} );
