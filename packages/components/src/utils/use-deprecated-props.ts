/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

export function useDeprecated36pxDefaultSizeProp<
	P extends Record< string, any > & {
		__next36pxDefaultSize?: boolean;
		__next40pxDefaultSize?: boolean;
	}
>(
	props: P,
	/** The component identifier in dot notation, e.g. `wp.components.ComponentName`. */
	componentIdentifier: string
) {
	const { __next36pxDefaultSize, __next40pxDefaultSize, ...otherProps } =
		props;
	if ( typeof __next36pxDefaultSize !== 'undefined' ) {
		deprecated( '`__next36pxDefaultSize` prop in ' + componentIdentifier, {
			alternative: '`__next40pxDefaultSize`',
			since: '6.3',
		} );
	}

	return {
		...otherProps,
		__next40pxDefaultSize: __next40pxDefaultSize ?? __next36pxDefaultSize,
	};
}
