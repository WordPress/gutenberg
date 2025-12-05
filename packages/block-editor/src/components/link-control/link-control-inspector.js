/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Dropdown,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { LinkPreviewButton } from './link-preview-button';
import LinkControl from './index';

/**
 * LinkControlInspector component that combines the preview button and search input.
 * Shows a preview button as a trigger, and opens a popover with search input when clicked.
 *
 * @param {Object}   props                  - Component props
 * @param {Object}   props.link             - Link object with label, url, type, kind, id
 * @param {string}   props.title            - Title to display (defaults to rich URL data)
 * @param {string}   props.image            - Image URL (optional)
 * @param {Function} props.onSelect         - Callback when a suggestion is selected
 * @param {Object}   props.suggestionsQuery - Query parameters for suggestions
 * @param {string}   props.label            - Label for the control
 * @param {string}   props.help             - Help text for the control
 */
export function LinkControlInspector( {
	link,
	title,
	image,
	onSelect,
	suggestionsQuery,
	label,
	help,
} ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const inputId = useInstanceId(
		LinkControlInspector,
		'link-control-inspector'
	);
	const helpId = useInstanceId(
		LinkControlInspector,
		'link-control-inspector-help'
	);

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
				link={ link }
				title={ title }
				image={ image }
				onClick={ () => setIsOpen( true ) }
				aria-haspopup="dialog"
				aria-expanded={ isOpen }
				aria-describedby={ help ? helpId : undefined }
				id={ inputId }
			/>
		);
	};

	const renderContent = () => (
		<DropdownContentWrapper paddingSize="none">
			<LinkControl
				key={ isOpen ? 'open' : 'closed' }
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
		<BaseControl
			label={ label }
			id={ inputId }
			help={ help }
			__nextHasNoMarginBottom
			__associatedWPComponentProps={ {
				helpId,
			} }
		>
			<Dropdown
				className="link-control-inspector__dropdown"
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
