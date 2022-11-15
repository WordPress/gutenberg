/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import {
	SelectControl,
	TextControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

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

	const areas = useSelect( ( select ) => {
		// FIXME: @wordpress/block-library should not depend on @wordpress/editor.
		// Blocks can be loaded into a *non-post* block editor.
		/* eslint-disable @wordpress/data-no-store-string-literals */
		return select(
			'core/editor'
		).__experimentalGetDefaultTemplatePartAreas();
		/* eslint-enable @wordpress/data-no-store-string-literals */
	}, [] );

	return (
		<InspectorControls __experimentalGroup="advanced">
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

					<ToggleGroupControl
						help={ __(
							'The area of a page that this block should occupy.'
						) }
						label={ __( 'Area' ) }
						onChange={ setArea }
						value={ area }
					>
						{ areas.map( ( { area: value, icon, label } ) => (
							<ToggleGroupControlOptionIcon
								icon={ icon }
								key={ value }
								label={ label }
								value={ value }
							/>
						) ) }
					</ToggleGroupControl>
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
		</InspectorControls>
	);
}
