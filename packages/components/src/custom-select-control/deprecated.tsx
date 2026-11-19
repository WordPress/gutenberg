import deprecated from '@wordpress/deprecated';
import InternalCustomSelectControl from '.';
import type { CustomSelectOption, CustomSelectProps } from './types';

/**
 * `CustomSelectControl` is a dropdown for selecting a single option from a
 * list, with support for custom styling.
 *
 * @deprecated Use `SelectControl` from `@wordpress/ui` instead.
 */
export default function CustomSelectControl< T extends CustomSelectOption >(
	props: CustomSelectProps< T >
) {
	deprecated( 'wp.components.CustomSelectControl', {
		since: '7.3',
		version: '7.6',
		alternative: 'SelectControl from @wordpress/ui',
		link: 'https://wordpress.github.io/gutenberg/?path=/docs/components-customselectcontrol--migration-guide',
	} );

	return <InternalCustomSelectControl { ...props } />;
}
