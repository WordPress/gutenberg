/**
 * WordPress dependencies
 */
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { SelectControl, TextControl } from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { TemplatePartImportControls } from './import-controls';
import { unlock } from '../../lock-unlock';

const { HTMLElementControl } = unlock( blockEditorPrivateApis );

export function TemplatePartAdvancedControls( {
	tagName,
	setAttributes,
	isEntityAvailable,
	templatePartId,
	defaultWrapper,
	hasInnerBlocks,
	clientId,
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

	const defaultTemplatePartAreas = useSelect(
		( select ) =>
			select( coreStore ).getCurrentTheme()
				?.default_template_part_areas || [],
		[]
	);

	const areaOptions = defaultTemplatePartAreas.map(
		( { label, area: _area } ) => ( {
			label,
			value: _area,
		} )
	);

	return (
		<>
			{ isEntityAvailable && (
				<>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Title' ) }
						value={ title }
						onChange={ ( value ) => {
							setTitle( value );
						} }
						onFocus={ ( event ) => event.target.select() }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Area' ) }
						labelPosition="top"
						options={ areaOptions }
						value={ area }
						onChange={ setArea }
					/>
				</>
			) }
			<HTMLElementControl
				tagName={ tagName || '' }
				onChange={ ( value ) => setAttributes( { tagName: value } ) }
				clientId={ clientId }
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
			/>
			{ ! hasInnerBlocks && (
				<TemplatePartImportControls
					area={ area }
					setAttributes={ setAttributes }
				/>
			) }
		</>
	);
}
