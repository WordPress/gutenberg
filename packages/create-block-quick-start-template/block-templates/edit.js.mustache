/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Imports the InspectorControls component, which is used to wrap 
 * the block's custom controls that will appear in in the Settings
 * Sidebar when the block is selected.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#inspectoradvancedcontrols
 */
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Imports the necessary components that will be used to create
 * the user interface for the block's settings.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/components/panel/#panelbody
 * @see https://developer.wordpress.org/block-editor/reference-guides/components/text-control/
 * @see https://developer.wordpress.org/block-editor/reference-guides/components/toggle-control/
 */
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @param {Object}   props               Properties passed to the function.
 * @param {Object}   props.attributes    Available block attributes.
 * @param {Function} props.setAttributes Function that updates individual attributes.
 *
 * @return {Element} Element to render.
 */
export default function Edit( { attributes, setAttributes } ) {
	const { showStartingYear, startingYear } = attributes;

	// Get the current year.
	const currentYear = new Date().getFullYear();
	let displayDate;

	// Display the starting year as well if supplied by the user.
	if ( showStartingYear && startingYear ) {
		displayDate = startingYear + '–' + currentYear;
	} else {
		displayDate = currentYear;
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'copyright-date-block' ) }>
					<ToggleControl
						checked={ showStartingYear }
						label={ __(
							'Show starting year',
							'copyright-date-block'
						) }
						onChange={ () =>
							setAttributes( {
								showStartingYear: ! showStartingYear,
							} )
						}
					/>
					{ showStartingYear && (
						<TextControl
							label={ __(
								'Starting year',
								'copyright-date-block'
							) }
							value={ startingYear }
							onChange={ ( year ) =>
								setAttributes( { startingYear: year } )
							}
						/>
					) }
				</PanelBody>
			</InspectorControls>
			<p { ...useBlockProps() }>© { displayDate }</p>
		</>
	);
}
