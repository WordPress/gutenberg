/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

export function maybeWarnDeprecated36pxSize( {
	componentName,
	__next40pxDefaultSize,
	size,
}: {
	componentName: string;
	__next40pxDefaultSize: boolean | undefined;
	size: string;
} ) {
	if ( __next40pxDefaultSize || size !== 'default' ) {
		return;
	}

	deprecated( `36px default size for wp.components.${ componentName }`, {
		since: '6.7',
		version: '7.0',
		hint: 'Set the `__next40pxDefaultSize` prop to true to start opting into the new default size, which will become the default in a future version.',
	} );
}
