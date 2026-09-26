import { render } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { describe, expect, it } from 'vitest';
import { Radio } from '../../radio';
import { RadioGroup } from '../index';

describe( 'RadioGroup', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLDivElement >();

		render(
			<RadioGroup ref={ ref } aria-label="Fruit">
				<Radio value="apple" aria-label="Apple" />
			</RadioGroup>
		);

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
	} );
} );
