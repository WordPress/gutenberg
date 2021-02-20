/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function TemplatePartCategoryPanel( { postId } ) {
	const [ area, setArea ] = useEntityProp(
		'postType',
		'wp_template_part',
		'area',
		postId
	);

	return (
		<PanelBody title={ __( 'Category' ) }>
			<SelectControl
				label={ __( 'Select template part category' ) }
				labelPosition="top"
				options={ [
					{ label: __( 'Header' ), value: 'header' },
					{ label: __( 'Footer' ), value: 'footer' },
					{
						label: __( 'General' ),
						value: 'uncategorized',
					},
				] }
				value={ area }
				direction="column"
				justify="flex-start"
				onChange={ ( value ) => setArea( value ) }
			/>
		</PanelBody>
	);
}
