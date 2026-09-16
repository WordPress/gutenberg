import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { __experimentalDivider as Divider } from '../../index';

describe( 'Shows a deprecation warning', () => {
	test( '__experimentalDivider warns that it is deprecated since 7.2 and will be removed in 7.4', () => {
		render( <Divider /> );

		expect( console ).toHaveWarnedWith(
			'wp.components.__experimentalDivider is deprecated since version 7.2 and will be removed in version 7.4.'
		);
		expect( screen.getByRole( 'separator' ) ).toBeVisible();
	} );
} );
