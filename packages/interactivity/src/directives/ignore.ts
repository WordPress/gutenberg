import { h as createElement } from 'preact';
import { useMemo } from 'preact/hooks';
import { directive } from '../hooks';
import { warn } from '../utils';

// data-wp-ignore (deprecated) — Preserve inner HTML.
directive(
	'ignore',
	( {
		element: {
			type: Type,
			props: { innerHTML, ...rest },
		},
	}: {
		element: any;
	} ) => {
		if ( globalThis.SCRIPT_DEBUG ) {
			warn(
				'The data-wp-ignore directive is deprecated and will be removed in version 7.0.'
			);
		}

		// Preserve the initial inner HTML
		// eslint-disable-next-line react-hooks/exhaustive-deps
		const cached = useMemo( () => innerHTML, [] );
		return createElement( Type, {
			dangerouslySetInnerHTML: { __html: cached },
			...rest,
		} );
	}
);
