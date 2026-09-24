import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Radio } from '../index';
import { RadioGroup } from '../../radio-group';

describe( 'Radio', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLSpanElement >();

		render(
			<RadioGroup>
				<Radio ref={ ref } value="option" />
			</RadioGroup>
		);

		expect( ref.current ).toBeInstanceOf( HTMLSpanElement );
	} );
} );
