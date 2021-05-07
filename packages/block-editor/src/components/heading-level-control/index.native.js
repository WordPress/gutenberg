/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { ToolbarDropdownMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import HeadingLevelIcon from './heading-level-icon';

const HEADING_LEVELS = [ 1, 2, 3, 4, 5, 6 ];

/** @typedef {import('@wordpress/element').WPComponent} WPComponent */

/**
 * HeadingLevelControl props.
 *
 * @typedef WPHeadingLevelControlProps
 *
 * @property {number} selectedLevel The chosen heading level.
 * @property {(newValue:number)=>any} onChange Callback to run when toolbar value is changed.
 * @property {boolean} isParagraphAllowed Append paragraph option with zero level to available levels.
 */

/**
 * The `HeadingLevelControl` component renders a dropdown menu that displays
 * heading level options for the selected block. This component is used to set
 * the level of the heading in a block and also allows to use a `paragraph`
 * element by setting the level to zero (`0`). The block's `edit` function
 * would also need to handle the zero value. An example of this would be
 * `const TagName = level === 0 ? 'p' : `h${ level }`;`
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
		<ToolbarDropdownMenu
			icon={ <HeadingLevelIcon level={ selectedLevel } /> }
			controls={ allControls }
			label={ __( 'Change heading level' ) }
		/>
	);
}
