/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

export default function TemplatePartAreaSelector( { id } ) {
	const [ area, setArea ] = useEntityProp(
		'postType',
		'wp_template_part',
		'area',
		id
	);

	const definedAreas = useSelect(
		( select ) =>
			select( editorStore ).__experimentalGetDefaultTemplatePartAreas(),
		[]
	);

	const areaOptions = definedAreas.map( ( { label, area: _area } ) => ( {
		label,
		value: _area,
	} ) );

	return (
		<SelectControl
			__nextHasNoMarginBottom
			label={ __( 'Area' ) }
			labelPosition="top"
			options={ areaOptions }
			value={ area }
			onChange={ setArea }
		/>
	);
}
