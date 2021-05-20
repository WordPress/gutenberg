/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import { SelectControl, TextControl } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { InspectorAdvancedControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

export function TemplatePartAdvancedControls( {
	tagName,
	setAttributes,
	isEntityAvailable,
	templatePartId,
	defaultWrapper,
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

	const { areaOptions } = useSelect( ( select ) => {
		const definedAreas = select(
			editorStore
		).__experimentalGetDefaultTemplatePartAreas();
		return {
			areaOptions: definedAreas.map( ( { label, area: _area } ) => ( {
				label,
				value: _area,
			} ) ),
		};
	}, [] );

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
						options={ areaOptions }
						value={ area }
						onChange={ setArea }
					/>
				</>
			) }
			<SelectControl
				label={ __( 'HTML element' ) }
				options={ [
					{
						label: sprintf(
							/* translators: %s: HTML tag based on area. */
							__( 'Default based on area (%s)' ),
							`<${ defaultWrapper }>`
						),
						value: '',
					},
					{ label: '<header>', value: 'header' },
					{ label: '<main>', value: 'main' },
					{ label: '<section>', value: 'section' },
					{ label: '<article>', value: 'article' },
					{ label: '<aside>', value: 'aside' },
					{ label: '<footer>', value: 'footer' },
					{ label: '<div>', value: 'div' },
				] }
				value={ tagName || '' }
				onChange={ ( value ) => setAttributes( { tagName: value } ) }
			/>
		</InspectorAdvancedControls>
	);
}
