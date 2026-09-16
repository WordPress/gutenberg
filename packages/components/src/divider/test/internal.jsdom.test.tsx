import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardDivider } from '../../card';
import { Divider } from '..';

const DIVIDER_DEPRECATION_MESSAGE =
	'wp.components.__experimentalDivider is deprecated since version 7.2 and will be removed in version 7.4.';

describe( 'does not warn about __experimentalDivider', () => {
	test( 'CardDivider does not warn about __experimentalDivider', () => {
		render( <CardDivider /> );

		expect( screen.getByRole( 'separator' ) ).toBeVisible();
		expect( console ).not.toHaveWarnedWith( DIVIDER_DEPRECATION_MESSAGE );
	} );

	test( 'silent Divider does not warn about __experimentalDivider', () => {
		render( <Divider /> );

		expect( screen.getByRole( 'separator' ) ).toBeVisible();
		expect( console ).not.toHaveWarnedWith( DIVIDER_DEPRECATION_MESSAGE );
	} );
} );
