/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	ToolbarItem,
	__experimentalText as Text,
} from '@wordpress/components';

/**
 * Renders a dropdown menu that displays information about pattern overrides.
 *
 * @param {Object}      props               Component props.
 * @param {JSX.Element} props.icon          The icon element to display.
 * @param {string}      props.label         The label for the dropdown.
 * @param {string}      props.description   The description text to display.
 * @param {string}      props.descriptionId The ID for the description element.
 * @return {JSX.Element} The pattern overrides dropdown component.
 */
export default function PatternOverridesDropdown( {
	icon,
	label,
	description,
	descriptionId,
} ) {
	return (
		<ToolbarItem>
			{ ( toggleProps ) => (
				<DropdownMenu
					className="block-editor-block-toolbar__pattern-overrides-indicator"
					label={ label }
					popoverProps={ {
						placement: 'bottom-start',
						className:
							'block-editor-block-toolbar__pattern-overrides-popover',
					} }
					icon={ icon }
					toggleProps={ {
						description,
						...toggleProps,
					} }
					menuProps={ {
						orientation: 'both',
						'aria-describedby': descriptionId,
					} }
				>
					{ () => <Text id={ descriptionId }>{ description }</Text> }
				</DropdownMenu>
			) }
		</ToolbarItem>
	);
}
