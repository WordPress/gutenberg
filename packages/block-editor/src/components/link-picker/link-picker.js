/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Dropdown,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
	useBaseControlProps,
} from '@wordpress/components';
import { useState, useId } from '@wordpress/element';

/**
 * Internal dependencies
 */
import LinkControl from '../link-control';
import { LinkPreviewButton } from './link-preview-button';

/**
 * LinkPicker component that combines the preview button and search input.
 * Shows a preview button as a trigger, and opens a popover with search input when clicked.
 *
 * @param {Object}   props                  - Component props
 * @param {Object}   props.preview          - Preview data with title, url, image, badges
 * @param {Function} props.onSelect         - Callback when a suggestion is selected
 * @param {Object}   props.suggestionsQuery - Query parameters for suggestions
 * @param {string}   props.label            - Label for the control
 * @param {string}   props.help             - Help text for the control
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

	const renderToggle = () => {
		return (
			<LinkPreviewButton
				preview={ preview }
				onClick={ () => setIsOpen( ! isOpen ) }
				aria-haspopup="dialog"
				aria-expanded={ isOpen }
				aria-describedby={ controlProps[ 'aria-describedby' ] }
				label={ label }
			/>
		);
	};

	const renderContent = () => (
		<DropdownContentWrapper paddingSize="none">
			<LinkControl
				key={ `${ instanceId }-${ isOpen ? 'open' : 'closed' }` }
				value={ null }
				onChange={ handleChange }
				suggestionsQuery={ suggestionsQuery }
				showInitialSuggestions
				forceIsEditingLink
				settings={ [] }
			/>
		</DropdownContentWrapper>
	);

	return (
		<BaseControl { ...baseControlProps } __nextHasNoMarginBottom>
			<BaseControl.VisualLabel>{ label }</BaseControl.VisualLabel>
			<Dropdown
				className="link-picker__dropdown"
				open={ isOpen }
				onToggle={ () => setIsOpen( ! isOpen ) }
				popoverProps={ {
					placement: 'left-start',
					offset: 36,
					shift: true,
				} }
				renderToggle={ renderToggle }
				renderContent={ renderContent }
			/>
		</BaseControl>
	);
}
