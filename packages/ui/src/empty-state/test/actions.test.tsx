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
import { Actions } from '../index';
import { Button } from '../../button';

describe( 'EmptyState.Actions', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLDivElement >();

		render(
			<Actions ref={ ref }>
				<Button>Action</Button>
			</Actions>
		);

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
	} );
} );
