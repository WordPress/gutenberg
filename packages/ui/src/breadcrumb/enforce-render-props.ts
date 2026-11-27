import { cloneElement } from '@wordpress/element';
import type { ReactElement } from 'react';

function enforceRenderProps< TRender >(
	render: TRender | undefined,
	props: Record< string, unknown >
): TRender | undefined {
	if ( ! render ) {
		return undefined;
	}

	const enforce = ( element: ReactElement ) =>
		cloneElement(
			element as ReactElement< Record< string, unknown > >,
			props
		);

	if ( typeof render === 'function' ) {
		const renderFunction = render as ( ...args: never[] ) => ReactElement;
		return ( ( ...args: never[] ) =>
			enforce( renderFunction( ...args ) ) ) as TRender;
	}

	return enforce( render as unknown as ReactElement ) as TRender;
}

export { enforceRenderProps };
