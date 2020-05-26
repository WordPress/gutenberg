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
import HeadingLevelChecker from './heading-level-checker';
import HeadingLevelIcon from './heading-level-icon';

const HEADING_LEVELS = [ 1, 2, 3, 4, 5, 6 ];

const POPOVER_PROPS = {
	className: 'block-library-heading-level-dropdown',
	isAlternate: true,
};

/** @typedef {import('@wordpress/element').WPComponent} WPComponent */

/**
 * HeadingLevelDropdown props.
 *
 * @typedef WPHeadingLevelDropdownProps
 *
 * @property {string}                 clientId      The current block client id.
 * @property {number}                 selectedLevel The chosen heading level.
 * @property {(newValue:number)=>any} onChange      Callback to run when
 *                                                  toolbar value is changed.
 */

/**
 * Dropdown for selecting a heading level (1 through 6).
 *
 * @param {WPHeadingLevelDropdownProps} props Component props.
 *
 * @return {WPComponent} The toolbar.
 */
export default function HeadingLevelDropdown( {
	clientId,
	selectedLevel,
	onChange,
} ) {
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
				<>
					<Toolbar
						className="block-library-heading-level-toolbar"
						__experimentalAccessibilityLabel={ __(
							'Change heading level'
						) }
					>
						<ToolbarGroup
							isCollapsed={ false }
							controls={ HEADING_LEVELS.map( ( targetLevel ) => {
								const isActive = targetLevel === selectedLevel;
								return {
									icon: (
										<HeadingLevelIcon
											level={ targetLevel }
											isPressed={ isActive }
										/>
									),
									title: sprintf(
										// translators: %s: heading level e.g: "1", "2", "3"
										__( 'Heading %d' ),
										targetLevel
									),
									isActive,
									onClick() {
										onChange( targetLevel );
									},
								};
							} ) }
						/>
					</Toolbar>
					<HeadingLevelChecker selectedHeadingId={ clientId } />
				</>
			) }
		/>
	);
}
