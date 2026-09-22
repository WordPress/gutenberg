import { cloneElement } from '@wordpress/element';
import type { ReactElement } from 'react';

const EVENT_HANDLER_PATTERN = /^on[A-Z]/;

function isBehaviorProp( propName: string ) {
	return (
		propName === 'id' ||
		propName === 'ref' ||
		propName === 'tabIndex' ||
		EVENT_HANDLER_PATTERN.test( propName )
	);
}

function getMeasurementProps( props: Record< string, unknown > ) {
	return Object.fromEntries(
		Object.entries( props ).filter(
			( [ propName ] ) => ! isBehaviorProp( propName )
		)
	);
}

function sanitizeElement( element: ReactElement ) {
	const behaviorOverrides: Record< string, unknown > = { ref: null };

	for ( const propName of Object.keys( element.props ) ) {
		if ( isBehaviorProp( propName ) ) {
			behaviorOverrides[ propName ] = undefined;
		}
	}

	return cloneElement(
		element as ReactElement< Record< string, unknown > >,
		behaviorOverrides
	);
}

function getMeasurementRender< TRender >( render: TRender ): TRender {
	if ( typeof render === 'function' ) {
		const renderFunction = render as (
			props: Record< string, unknown >,
			...args: unknown[]
		) => ReactElement;

		return ( ( props: Record< string, unknown >, ...args: unknown[] ) =>
			sanitizeElement(
				renderFunction( getMeasurementProps( props ), ...args )
			) ) as TRender;
	}

	return sanitizeElement( render as ReactElement ) as TRender;
}

export { getMeasurementProps, getMeasurementRender };
