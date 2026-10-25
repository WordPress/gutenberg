import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Tooltip } from '../..';
import InternalTooltip from '..';
import Button from '../../button';

describe( 'Deprecated Tooltip', () => {
	it.each( [ undefined, 'bottom left' ] as const )(
		'warns only about public use and forwards the ref (position=%s)',
		( position ) => {
			const ref = createRef< HTMLButtonElement >();

			render(
				<Tooltip ref={ ref } text="Publish" position={ position }>
					<button>Publish</button>
				</Tooltip>
			);

			expect( console ).toHaveWarnedWith(
				'wp.components.Tooltip is deprecated since version 7.2 and will be removed in version 7.4. Please use Tooltip from @wordpress/ui instead.'
			);
			expect( ref.current ).toBe(
				screen.getByRole( 'button', { name: 'Publish' } )
			);
		}
	);

	it( 'keeps the position prop warning for internal callers', () => {
		render(
			<InternalTooltip text="Publish" position="bottom left">
				<button>Publish</button>
			</InternalTooltip>
		);

		expect( console ).toHaveWarnedWith(
			'`position` prop in wp.components.tooltip is deprecated since version 6.4. Please use `placement` prop instead.'
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
