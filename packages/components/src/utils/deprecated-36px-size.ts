/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

export function maybeWarnDeprecated36pxSize( {
	componentName,
	__next40pxDefaultSize,
	size,
	__shouldNotWarnDeprecated36pxSize,
}: {
	componentName: string;
	__next40pxDefaultSize: boolean | undefined;
	size: string | undefined;
	__shouldNotWarnDeprecated36pxSize?: boolean;
} ) {
	if (
		__shouldNotWarnDeprecated36pxSize ||
		__next40pxDefaultSize ||
		( size !== undefined && size !== 'default' )
	) {
		return;
	}

	deprecated( `36px default size for wp.components.${ componentName }`, {
		since: '6.8',
		version: '7.1',
		hint: 'Set the `__next40pxDefaultSize` prop to true to start opting into the new default size, which will become the default in a future version.',
	} );
}
