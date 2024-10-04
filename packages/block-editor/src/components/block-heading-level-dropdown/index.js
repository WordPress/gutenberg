/**
 * WordPress dependencies
 */
import { ToolbarDropdownMenu } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import HeadingLevelIcon from './heading-level-icon';

const HEADING_LEVELS = [ 1, 2, 3, 4, 5, 6 ];

const POPOVER_PROPS = {
	className: 'block-library-heading-level-dropdown',
};

/** @typedef {import('react').ComponentType} ComponentType */

/**
 * HeadingLevelDropdown props.
 *
 * @typedef WPHeadingLevelDropdownProps
 *
 * @property {number}     value    The chosen heading level.
 * @property {number[]}   options  An array of supported heading levels.
 * @property {()=>number} onChange Function called with
 *                                 the selected value changes.
 */

/**
 * Dropdown for selecting a heading level (1 through 6) or paragraph (0).
 *
 * @param {WPHeadingLevelDropdownProps} props Component props.
 *
 * @return {ComponentType} The toolbar.
 */
export default function HeadingLevelDropdown( {
	options = HEADING_LEVELS,
	value,
	onChange,
} ) {
	const validOptions = options
		.filter(
			( option ) => option === 0 || HEADING_LEVELS.includes( option )
		)
		.sort( ( a, b ) => a - b ); // Sorts numerically in ascending order;

	return (
		<ToolbarDropdownMenu
			popoverProps={ POPOVER_PROPS }
			icon={ <HeadingLevelIcon level={ value } /> }
			label={ __( 'Change level' ) }
			controls={ validOptions.map( ( targetLevel ) => {
				const isActive = targetLevel === value;
				return {
					icon: <HeadingLevelIcon level={ targetLevel } />,
					title:
						targetLevel === 0
							? __( 'Paragraph' )
							: sprintf(
									// translators: %d: heading level e.g: "1", "2", "3"
									__( 'Heading %d' ),
									targetLevel
							  ),
					isActive,
					onClick() {
						onChange( targetLevel );
					},
					role: 'menuitemradio',
				};
			} ) }
		/>
	);
}
