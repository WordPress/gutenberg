import { SelectControl } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';

const stickyOptions = [
	{ label: __( 'Include' ), value: '' },
	{ label: __( 'Ignore' ), value: 'ignore' },
	{ label: __( 'Exclude' ), value: 'exclude' },
	{ label: __( 'Only' ), value: 'only' },
];

export default function StickyControl( { value, onChange } ) {
	return (
		<SelectControl
			label={ __( 'Sticky posts' ) }
			items={ stickyOptions }
			value={
				stickyOptions.find( ( item ) => item.value === value ) ??
				stickyOptions[ 0 ]
			}
			itemToStringValue={ ( item ) => `sticky:${ item.value }` }
			onValueChange={ ( item ) => item && onChange( item.value ) }
			description={ __(
				'Sticky posts always appear first, regardless of their publish date.'
			) }
		/>
	);
}
