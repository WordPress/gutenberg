/**
 * WordPress dependencies
 */
import { ToolbarDropdownMenu } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import HeadingLevelIcon from './heding-level-icon';

const HEADING_LEVELS = [ 1, 2, 3, 4, 5, 6 ];

const POPOVER_PROPS = {
	className: 'block-library-heading-level-dropdown',
};

/** @typedef {import('@wordpress/element').WPComponent} WPComponent */

/**
 * HeadingLevelDropdown props.
 *
 * @typedef WPHeadingLevelDropdownProps
 *
 * @property {number}                 selectedLevel The chosen heading level.
 * @property {(newValue:number)=>any} onChange      Callback to run when
 *                                                  toolbar value is changed.
 */

/**
 * Dropdown for selecting a heading level (1 through 6) or paragraph (0).
 *
 * @param {WPHeadingLevelDropdownProps} props Component props.
 *
 * @return {WPComponent} The toolbar.
 */
export default function HeadingLevelDropdown( {
	levels,
	selectedLevel,
	onChange,
} ) {
	if ( levels === undefined ) {
		levels = HEADING_LEVELS;
	}
	return (
		<ToolbarDropdownMenu
			popoverProps={ POPOVER_PROPS }
			icon={ <HeadingLevelIcon level={ selectedLevel } /> }
			label={ __( 'Change level' ) }
			controls={ levels.map( ( targetLevel ) => {
				{
					const isActive = targetLevel === selectedLevel;

					return {
						icon: (
							<HeadingLevelIcon
								level={ targetLevel }
								isPressed={ isActive }
							/>
						),
						label:
							targetLevel === 0
								? __( 'Paragraph' )
								: sprintf(
										// translators: %s: heading level e.g: "1", "2", "3"
										__( 'Heading %d' ),
										targetLevel
								  ),
						isActive,
						onClick() {
							onChange( targetLevel );
						},
						role: 'menuitemradio',
					};
				}
			} ) }
		/>
	);
}
