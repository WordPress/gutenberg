/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const CATEGORY_OPTIONS = [
	{ label: __( 'Header' ), value: 'header' },
	{ label: __( 'Footer' ), value: 'footer' },
	{
		label: __( 'General' ),
		value: 'uncategorized',
	},
];

export default function TemplatePartCategoryPanel( { postId } ) {
	const [ area, setArea ] = useEntityProp(
		'postType',
		'wp_template_part',
		'area',
		postId
	);

	return (
		<SelectControl
			label={ __( 'Area' ) }
			labelPosition="top"
			options={ CATEGORY_OPTIONS }
			value={ area }
			onChange={ setArea }
		/>
	);
}
