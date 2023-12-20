/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

export function useDeprecated36pxDefaultSizeProp<
	P extends Record< string, any > & {
		__next36pxDefaultSize?: boolean;
		__next40pxDefaultSize?: boolean;
	},
>(
	props: P,
	/** The component identifier in dot notation, e.g. `wp.components.ComponentName`. */
	componentIdentifier: string,
	/** Version in which the prop was deprecated. */
	since: string = '6.3'
) {
	const { __next36pxDefaultSize, __next40pxDefaultSize, ...otherProps } =
		props;
	if ( typeof __next36pxDefaultSize !== 'undefined' ) {
		deprecated( '`__next36pxDefaultSize` prop in ' + componentIdentifier, {
			alternative: '`__next40pxDefaultSize`',
			since,
		} );
	}

	return {
		...otherProps,
		__next40pxDefaultSize: __next40pxDefaultSize ?? __next36pxDefaultSize,
	};
}
