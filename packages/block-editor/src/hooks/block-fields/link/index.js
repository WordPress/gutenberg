/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { LinkPicker } from '../../../components/link-picker';

export default function Link( { data, field, onChange } ) {
	const value = field.getValue( { item: data } );
	const url = value?.url;

	const preview = {
		title: url || __( 'Add link' ),
		url: url || '',
	};

	return (
		<LinkPicker
			preview={ preview }
			onSelect={ ( suggestion ) => {
				onChange(
					field.setValue( {
						item: data,
						value: { url: suggestion.url },
					} )
				);
			} }
			label={ field.label }
		/>
	);
}
