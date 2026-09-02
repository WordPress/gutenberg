import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { RadioGroup } from '@base-ui/react/radio-group';
import { createRef } from '@wordpress/element';
import { Radio } from '../index';

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
