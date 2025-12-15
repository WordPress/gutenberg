/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Button,
	Popover,
	VisuallyHidden,
	useBaseControlProps,
} from '@wordpress/components';
import { useState, useId, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import LinkControl from '../link-control';
import { LinkPreview } from './link-preview';

/**
 * @typedef {Object} LinkPickerPreview
 * @property {string}        title           - Display title for the link
 * @property {string}        url             - Display URL for the link
 * @property {string}        [image]         - Optional image URL for the link preview
 * @property {Array<Object>} [badges]        - Optional array of badge objects with label and intent
 * @property {string}        badges[].label  - Badge label text
 * @property {string}        badges[].intent - Badge intent/style
 */

/**
 * LinkPicker component that combines the preview button and search input.
 * Shows a preview button as a trigger, and opens a popover with search input when clicked.
 *
 * @param {Object}            props                  - Component props
 * @param {LinkPickerPreview} props.preview          - Preview data object
 * @param {Function}          props.onSelect         - Callback when a suggestion is selected
 * @param {Object}            props.suggestionsQuery - Query parameters for suggestions
 * @param {string}            props.label            - Label for the control
 * @param {string}            props.help             - Help text for the control
 */
export function LinkPicker( {
	preview,
	onSelect,
	suggestionsQuery,
	label,
	help,
} ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const instanceId = useId();
	const dialogTitleId = `link-picker-title-${ instanceId }`;
	const dialogDescriptionId = `link-picker-description-${ instanceId }`;
	const anchorRef = useRef( null );

	// Use the proper BaseControl pattern for associating help text
	const { baseControlProps, controlProps } = useBaseControlProps( {
		help,
		__nextHasNoMarginBottom: true,
	} );

	const handleChange = ( newValue ) => {
		// Close the popover immediately
		setIsOpen( false );

		// When a link is selected in LinkControl
		if ( newValue ) {
			const suggestion = {
				url: newValue.url,
				kind: newValue.kind,
				type: newValue.type,
				id: newValue.id,
				title: newValue.title,
			};
			onSelect( suggestion );
		}
	};

	return (
		<BaseControl { ...baseControlProps } __nextHasNoMarginBottom>
			<BaseControl.VisualLabel>{ label }</BaseControl.VisualLabel>
			<Button
				ref={ anchorRef }
				onClick={ () => setIsOpen( ! isOpen ) }
				aria-haspopup="dialog"
				aria-expanded={ isOpen }
				aria-describedby={ controlProps[ 'aria-describedby' ] }
				variant="secondary"
				__next40pxDefaultSize
				className="link-preview-button"
			>
				{ label && <VisuallyHidden>{ label }:</VisuallyHidden> }
				<LinkPreview
					title={ preview.title || __( 'Add link' ) }
					url={ preview.url }
					image={ preview.image }
					badges={ preview.badges }
				/>
			</Button>
			{ isOpen && (
				<Popover
					anchor={ anchorRef.current }
					onClose={ () => setIsOpen( false ) }
					placement="left-start"
					offset={ 36 }
					shift
				>
					<div
						role="dialog"
						aria-labelledby={ dialogTitleId }
						aria-describedby={ dialogDescriptionId }
					>
						<VisuallyHidden>
							<h2 id={ dialogTitleId }>
								{ __( 'Select a link' ) }
							</h2>
							<p id={ dialogDescriptionId }>
								{ __(
									'Search for and add a link to the navigation item.'
								) }
							</p>
						</VisuallyHidden>
						<LinkControl
							value={ null }
							onChange={ handleChange }
							suggestionsQuery={ suggestionsQuery }
							showInitialSuggestions
							forceIsEditingLink
							settings={ [] }
						/>
					</div>
				</Popover>
			) }
		</BaseControl>
	);
}
