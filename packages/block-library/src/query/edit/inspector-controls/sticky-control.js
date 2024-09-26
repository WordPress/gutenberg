/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const stickyOptions = [
	{ label: __( 'Include' ), value: '' },
	{ label: __( 'Exclude' ), value: 'exclude' },
	{ label: __( 'Only' ), value: 'only' },
];

export default function StickyControl( { value, onChange } ) {
	return (
		<SelectControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ __( 'Sticky posts' ) }
			options={ stickyOptions }
			value={ value }
			onChange={ onChange }
			help={ __(
				'Sticky posts always appear first, regardless of their publish date.'
			) }
		/>
	);
}
