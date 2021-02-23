/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { SelectControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { InspectorAdvancedControls } from '@wordpress/block-editor';

const AREA_OPTIONS = [
	{ label: __( 'Header' ), value: 'header' },
	{ label: __( 'Footer' ), value: 'footer' },
	{
		label: __( 'General' ),
		value: 'uncategorized',
	},
];

export function TemplatePartAdvancedControls( {
	TagName,
	setAttributes,
	isEntityAvailable,
	templatePartId,
} ) {
	const [ area, setArea ] = useEntityProp(
		'postType',
		'wp_template_part',
		'area',
		templatePartId
	);

	const [ title, setTitle ] = useEntityProp(
		'postType',
		'wp_template_part',
		'title',
		templatePartId
	);

	return (
		<InspectorAdvancedControls>
			{ isEntityAvailable && (
				<>
					<TextControl
						label={ __( 'Title' ) }
						value={ title }
						onChange={ ( value ) => {
							setTitle( value );
						} }
						onFocus={ ( event ) => event.target.select() }
					/>

					<SelectControl
						label={ __( 'Area' ) }
						labelPosition="top"
						options={ AREA_OPTIONS }
						value={ area }
						onChange={ setArea }
					/>
				</>
			) }
			<SelectControl
				label={ __( 'HTML element' ) }
				options={ [
					{ label: __( 'Default (<div>)' ), value: 'div' },
					{ label: '<header>', value: 'header' },
					{ label: '<main>', value: 'main' },
					{ label: '<section>', value: 'section' },
					{ label: '<article>', value: 'article' },
					{ label: '<aside>', value: 'aside' },
					{ label: '<footer>', value: 'footer' },
				] }
				value={ TagName }
				onChange={ ( value ) => setAttributes( { tagName: value } ) }
			/>
		</InspectorAdvancedControls>
	);
}
