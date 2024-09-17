/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { DropdownMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import HeadingLevelIcon from './heading-level-icon';

const HEADING_LEVELS = [ 1, 2, 3, 4, 5, 6 ];

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
 * Dropdown for selecting a heading level (1 through 6).
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
	const createLevelControl = (
		targetLevel,
		currentLevel,
		onChangeCallback
	) => {
		const isActive = targetLevel === currentLevel;
		return {
			icon: (
				<HeadingLevelIcon
					level={ targetLevel }
					isPressed={ isActive }
				/>
			),
			// translators: %d: heading level e.g: "1", "2", "3"
			title: sprintf( __( 'Heading %d' ), targetLevel ),
			isActive,
			onClick: () => onChangeCallback( targetLevel ),
		};
	};

	return (
		<DropdownMenu
			icon={ <HeadingLevelIcon level={ value } /> }
			controls={ options.map( ( index ) =>
				createLevelControl( index, value, onChange )
			) }
			label={ __( 'Change level' ) }
		/>
	);
}
