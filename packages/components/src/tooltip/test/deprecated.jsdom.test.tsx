import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Tooltip } from '../..';
import InternalTooltip from '..';
import Button from '../../button';

describe( 'Deprecated Tooltip', () => {
	it( 'warns on public use and forwards the ref to the anchor', () => {
		const ref = createRef< HTMLButtonElement >();

		render(
			<Tooltip ref={ ref } text="Publish">
				<button>Publish</button>
			</Tooltip>
		);

		expect( console ).toHaveWarnedWith(
			'wp.components.Tooltip is deprecated since version 7.3 and will be removed in version 7.5. Please use Tooltip from @wordpress/ui instead.'
		);
		expect( ref.current ).toBe(
			screen.getByRole( 'button', { name: 'Publish' } )
		);
	} );

	it( 'keeps internal tooltips and Button tooltips silent', () => {
		render(
			<>
				<InternalTooltip text="Publish">
					<button>Publish</button>
				</InternalTooltip>
				<Button __next40pxDefaultSize label="Save" showTooltip>
					Save
				</Button>
			</>
		);

		expect(
			screen.getByRole( 'button', { name: 'Publish' } )
		).toBeVisible();
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeVisible();
		expect( console ).not.toHaveWarned();
	} );
} );
