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
import LinkControl from '../link-control';
import { LinkPreviewButton } from './link-preview-button';

/**
 * LinkPicker component that combines the preview button and search input.
 * Shows a preview button as a trigger, and opens a popover with search input when clicked.
 *
 * @param {Object}   props                   - Component props
 * @param {Object}   props.link              - Link object with label, url, type, kind, id
 * @param {string}   props.title             - Title to display (defaults to rich URL data)
 * @param {string}   props.image             - Image URL (optional)
 * @param {string}   props.entityStatus      - Entity status (publish, draft, etc.)
 * @param {boolean}  props.hasBinding        - Whether link has entity binding
 * @param {boolean}  props.isEntityAvailable - Whether bound entity is available
 * @param {Function} props.onSelect          - Callback when a suggestion is selected
 * @param {Object}   props.suggestionsQuery  - Query parameters for suggestions
 * @param {string}   props.label             - Label for the control
 * @param {string}   props.help              - Help text for the control
 */
export function LinkPicker( {
	link,
	title,
	image,
	entityStatus,
	hasBinding,
	isEntityAvailable,
	onSelect,
	suggestionsQuery,
	label,
	help,
} ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const helpId = useInstanceId( LinkPicker, 'link-picker-help' );

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
				entityStatus={ entityStatus }
				hasBinding={ hasBinding }
				isEntityAvailable={ isEntityAvailable }
				onClick={ () => setIsOpen( true ) }
				aria-haspopup="dialog"
				aria-expanded={ isOpen }
				aria-describedby={ help ? helpId : undefined }
				label={ label }
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
			__nextHasNoMarginBottom
			help={ help }
			__associatedWPComponentProps={ {
				helpId,
			} }
		>
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
