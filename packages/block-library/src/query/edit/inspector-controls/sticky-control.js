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
			label={ __( 'Sticky posts' ) }
			options={ stickyOptions }
			value={ value }
			onChange={ onChange }
			help={ __(
				'Blog posts can be “stickied”, a feature that places them at the top of the front page of posts, keeping it there until new sticky posts are published.'
			) }
		/>
	);
}
