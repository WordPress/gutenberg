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

/** @typedef {import('@wordpress/element').WPComponent} WPComponent */

/**
 * HeadingLevelDropdown props.
 *
 * @typedef WPHeadingLevelDropdownProps
 *
 * @property {number}                 value    The chosen heading level.
 * @property {number[]}               options  An array of supported heading levels.
 * @property {(newValue:number)=>any} onChange Callback to run when
 *                                             toolbar value is changed.
 */

/**
 * Dropdown for selecting a heading level (1 through 6) or paragraph (0).
 *
 * @param {WPHeadingLevelDropdownProps} props Component props.
 *
 * @return {WPComponent} The toolbar.
 */
export default function HeadingLevelDropdown( {
	options = HEADING_LEVELS,
	value,
	onChange,
} ) {
	return (
		<ToolbarDropdownMenu
			popoverProps={ POPOVER_PROPS }
			icon={ <HeadingLevelIcon level={ value } /> }
			label={ __( 'Change level' ) }
			controls={ options.map( ( targetLevel ) => {
				{
					const isActive = targetLevel === value;

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
