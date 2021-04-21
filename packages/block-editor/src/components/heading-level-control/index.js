/**
 * WordPress dependencies
 */
import {
	Dropdown,
	Toolbar,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import HeadingLevelIcon from './heading-level-icon';

const HEADING_LEVELS = [ 1, 2, 3, 4, 5, 6 ];
const POPOVER_PROPS = {
	className: 'block-editor-heading-level-dropdown',
	position: 'bottom right',
	isAlternate: true,
};

/** @typedef {import('@wordpress/element').WPComponent} WPComponent */

/**
 * HeadingLevelControl props.
 *
 * @typedef WPHeadingLevelControlProps
 *
 * @property {number} selectedLevel The chosen heading level.
 * @property {(newValue:number)=>any} onChange Callback to run when toolbar value is changed.
 * @property {boolean} isParagraphAllowed Append paragraph option with zero level to the available levels.
 */

/**
 * The `HeadingLevelControl` component renders a dropdown menu that displays
 * heading level options for the selected block. This component is used to set
 * the level of the heading in a block and also allows to use a `paragraph`
 * element by setting the level to zero (`0`).
 * This would also need handling in the block's `edit` function.
 *
 * @param {WPHeadingLevelControlProps} props Component props.
 * @return {WPComponent} The Heading Level Control Dropdown.
 */
export default function HeadingLevelControl( {
	selectedLevel,
	onChange,
	isParagraphAllowed = false,
} ) {
	const levels = ! isParagraphAllowed
		? HEADING_LEVELS
		: [ ...HEADING_LEVELS, 0 ];
	const allControls = levels.map( ( currentLevel ) => {
		const isActive = currentLevel === selectedLevel;
		return {
			icon: (
				<HeadingLevelIcon
					level={ currentLevel }
					isPressed={ isActive }
				/>
			),
			title:
				currentLevel === 0
					? __( 'Paragraph' )
					: // translators: %s: heading level e.g: "1", "2", "3"
					  sprintf( __( 'Heading %d' ), currentLevel ),
			isActive,
			onClick() {
				onChange( currentLevel );
			},
		};
	} );
	return (
		<Dropdown
			popoverProps={ POPOVER_PROPS }
			renderToggle={ ( { onToggle, isOpen } ) => {
				const openOnArrowDown = ( event ) => {
					if ( ! isOpen && event.keyCode === DOWN ) {
						event.preventDefault();
						event.stopPropagation();
						onToggle();
					}
				};

				return (
					<ToolbarButton
						aria-expanded={ isOpen }
						aria-haspopup="true"
						icon={ <HeadingLevelIcon level={ selectedLevel } /> }
						label={ __( 'Change heading level' ) }
						onClick={ onToggle }
						onKeyDown={ openOnArrowDown }
						showTooltip
					/>
				);
			} }
			renderContent={ () => (
				<Toolbar
					className="block-editor-heading-level-toolbar"
					label={ __( 'Change heading level' ) }
				>
					<ToolbarGroup
						isCollapsed={ false }
						controls={ allControls }
					/>
				</Toolbar>
			) }
		/>
	);
}
