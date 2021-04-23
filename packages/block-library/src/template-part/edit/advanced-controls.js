/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';
import {
	BaseControl,
	Button,
	SelectControl,
	TextControl,
	Tooltip,
} from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';
import { InspectorAdvancedControls } from '@wordpress/block-editor';
import { footer, header, layout } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getTagBasedOnArea } from './get-tag-based-on-area';

const AREA_OPTIONS = [
	{
		description: __(
			'The Header template defines a page area that typically contains a title, logo, and main navigation.'
		),
		icon: header,
		label: __( 'Header' ),
		value: 'header',
	},
	{
		description: __(
			'The Footer template defines a page area that typically contains site credits, social links, or any other combination of blocks.'
		),
		icon: footer,
		label: __( 'Footer' ),
		value: 'footer',
	},
	{
		description: __(
			'General templates often perform a specific role like displaying post content, and are not tied to any particular area.'
		),
		icon: layout,
		label: __( 'General' ),
		value: 'uncategorized',
	},
];

export function TemplatePartAdvancedControls( {
	tagName,
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

					<BaseControl
						id={ `template-part-area-control-${ templatePartId }` }
						className="template-part-area-control"
						help={ __(
							'The area of the page that this block should occupy.'
						) }
					>
						<BaseControl.VisualLabel className="template-part-area-control__label">
							{ __( 'Area' ) }
						</BaseControl.VisualLabel>

						<div>
							{ AREA_OPTIONS.map(
								( { description, icon, label, value } ) => (
									<Tooltip
										id={ `template-part-area-option-${ value }` }
										className="template-part-area-control__option-description"
										key={ value }
										position="top right"
										text={ description }
									>
										<Button
											aria-describedby={ `template-part-area-option-${ value }` }
											className="template-part-area-control__option"
											icon={ icon }
											isSecondary
											isPressed={ value === area }
											label={ label }
											onClick={ () => setArea( value ) }
										/>
									</Tooltip>
								)
							) }
						</div>
					</BaseControl>
				</>
			) }
			<SelectControl
				label={ __( 'HTML element' ) }
				options={ [
					{
						label: sprintf(
							/* translators: %s: HTML tag based on area. */
							__( 'Default based on area (%s)' ),
							`<${ getTagBasedOnArea( area ) }>`
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
