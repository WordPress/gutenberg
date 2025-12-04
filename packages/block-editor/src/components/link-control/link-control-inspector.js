/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Dropdown,
	__experimentalDropdownContentWrapper as DropdownContentWrapper,
} from '@wordpress/components';
import { useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { LinkPreviewButton } from './link-preview-button';
import LinkControl from './index';

/**
 * LinkControlInspector component that combines the preview button and search input.
 * Shows a preview button as a trigger, and opens a popover with search input when clicked.
 *
 * @param {Object}   props                        - Component props
 * @param {Object}   props.link                   - Link object with label, url, type, kind, id
 * @param {string}   props.title                  - Title to display (defaults to rich URL data)
 * @param {string}   props.featuredImage          - Featured image URL (optional)
 * @param {boolean}  props.hasEntityBinding       - Whether the link has an entity binding
 * @param {boolean}  props.isBoundEntityAvailable - Whether the bound entity is available
 * @param {Function} props.onSelect               - Callback when a suggestion is selected
 * @param {Object}   props.suggestionsQuery       - Query parameters for suggestions
 * @param {string}   props.label                  - Label for the control
 * @param {string}   props.inputId                - ID for the input element
 * @param {string}   props.helpTextId             - ID for the help text element
 * @param {Node}     props.helpText               - Help text to display (optional)
 */
export function LinkControlInspector( {
	link,
	title,
	featuredImage,
	hasEntityBinding,
	isBoundEntityAvailable,
	onSelect,
	suggestionsQuery,
	label,
	inputId,
	helpTextId,
	helpText,
} ) {
	const { url } = link || {};
	const [ isOpen, setIsOpen ] = useState( false );
	const toggleButtonRef = useRef();

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
			url && (
				<LinkPreviewButton
					buttonRef={ toggleButtonRef }
					link={ link }
					title={ title }
					featuredImage={ featuredImage }
					hasEntityBinding={ hasEntityBinding }
					onClick={ () => setIsOpen( true ) }
					aria-haspopup="dialog"
					aria-expanded={ isOpen }
					id={ `${ inputId }-button` }
				/>
			)
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
		<>
			<BaseControl
				label={ label }
				id={ `${ inputId }-button` }
				__nextHasNoMarginBottom
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
			{ hasEntityBinding && ! isBoundEntityAvailable && helpText && (
				<p id={ helpTextId }>{ helpText }</p>
			) }
		</>
	);
}
