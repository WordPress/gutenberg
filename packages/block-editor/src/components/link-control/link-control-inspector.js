/**
 * WordPress dependencies
 */
import { BaseControl } from '@wordpress/components';
import { useRef, useEffect, useState } from '@wordpress/element';
import { __experimentalUseDialog as useDialog } from '@wordpress/compose';
import { safeDecodeURI } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { LinkPreviewButton } from './link-preview-button';
import LinkControlSearchInput from './search-input';

/**
 * LinkControlInspector component that combines the preview button and search input.
 * Shows a preview button when a link exists, and toggles to a search input when editing.
 *
 * @param {Object}   props                        - Component props
 * @param {Object}   props.link                   - Link object with label, url, type, kind, id
 * @param {string}   props.featuredImage          - Featured image URL (optional)
 * @param {boolean}  props.hasEntityBinding       - Whether the link has an entity binding
 * @param {boolean}  props.isBoundEntityAvailable - Whether the bound entity is available
 * @param {Function} props.onSelect               - Callback when a suggestion is selected
 * @param {Function} props.onChange               - Callback when input value changes
 * @param {Object}   props.suggestionsQuery       - Query parameters for suggestions
 * @param {string}   props.className              - Additional CSS class for the search input
 * @param {string}   props.label                  - Label for the control
 * @param {string}   props.inputId                - ID for the input element
 * @param {string}   props.helpTextId             - ID for the help text element
 * @param {Node}     props.helpText               - Help text to display (optional)
 */
export function LinkControlInspector( {
	link,
	featuredImage,
	hasEntityBinding,
	isBoundEntityAvailable,
	onSelect,
	onChange,
	suggestionsQuery,
	className,
	label,
	inputId,
	helpTextId,
	helpText,
} ) {
	const { url } = link || {};

	// Local state to control the input value
	const [ inputValue, setInputValue ] = useState( url );

	// Track editing state to toggle between preview button and input
	const [ isEditing, setIsEditing ] = useState( ! url );
	const previewButtonRef = useRef();

	// Get dialog props for proper accessibility
	const [ dialogRef, dialogProps ] = useDialog( {
		focusOnMount: 'firstElement',
		onClose: () => {
			setIsEditing( false );
		},
	} );

	// Sync local state when url prop changes (e.g., from undo/redo or external updates)
	useEffect( () => {
		setInputValue( url );
	}, [ url ] );

	const handleInputChange = ( newValue ) => {
		// Update local input state when typing
		setInputValue( newValue );
		if ( onChange ) {
			onChange( newValue );
		}
	};

	const handleSelect = ( suggestion ) => {
		// When a suggestion is selected (or Enter pressed)
		if ( suggestion ) {
			onSelect( suggestion );
			// Exit edit mode and focus preview button
			setIsEditing( false );
			// Focus the preview button after state update
			setTimeout( () => {
				previewButtonRef.current?.focus();
			}, 0 );
		} else if ( inputValue ) {
			// Freeform URL entry
			onSelect( { url: inputValue } );
			// Exit edit mode and focus preview button
			setIsEditing( false );
			// Focus the preview button after state update
			setTimeout( () => {
				previewButtonRef.current?.focus();
			}, 0 );
		}
	};

	return (
		<>
			{ url && (
				<BaseControl
					label={ label }
					id={ `${ inputId }-button` }
					__nextHasNoMarginBottom
				>
					<LinkPreviewButton
						buttonRef={ previewButtonRef }
						link={ link }
						featuredImage={ featuredImage }
						hasEntityBinding={ hasEntityBinding }
						onClick={ () => {
							// Open it
							setInputValue( '' );
							setIsEditing( true );
						} }
						aria-haspopup="dialog"
						aria-expanded={ isEditing }
						id={ `${ inputId }-button` }
					/>
				</BaseControl>
			) }
			{ isEditing && (
				<div ref={ dialogRef } { ...dialogProps }>
					<LinkControlSearchInput
						className={ className }
						value={ inputValue ? safeDecodeURI( inputValue ) : '' }
						currentLink={ link }
						suggestionsQuery={ suggestionsQuery }
						onChange={ handleInputChange }
						onSelect={ handleSelect }
						showInitialSuggestions
						showSuggestions
					/>
				</div>
			) }
			{ hasEntityBinding && ! isBoundEntityAvailable && helpText && (
				<p id={ helpTextId }>{ helpText }</p>
			) }
		</>
	);
}
