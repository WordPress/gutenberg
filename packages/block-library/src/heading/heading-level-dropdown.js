/**
 * WordPress dependencies
 */
import {
	Dropdown,
	ExternalLink,
	Toolbar,
	ToolbarButton,
	ToolbarGroup,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { DOWN } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import HeadingLevelIcon from './heading-level-icon';
import HeadingLevelWarning from './heading-level-warning';
import useHeadingLevelValidator from './use-heading-level-validator';

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
	const helpTextId = useInstanceId(
		HeadingLevelDropdown,
		'block-library-heading__heading-level-dropdown__help'
	);

	const getLevelValidity = useHeadingLevelValidator( clientId );

	const { levelMayBeInvalid: selectedLevelMayBeInvalid } = getLevelValidity(
		selectedLevel
	);

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
						label={ __( 'Change heading level' ) }
					>
						<ToolbarGroup
							isCollapsed={ false }
							controls={ HEADING_LEVELS.map( ( targetLevel ) => {
								const isActive = targetLevel === selectedLevel;
								const levelMayBeInvalid = getLevelValidity(
									targetLevel
								).levelMayBeInvalid;

								return {
									icon: (
										<HeadingLevelIcon
											level={ targetLevel }
											isPressed={ isActive }
											isDiscouraged={ levelMayBeInvalid }
										/>
									),
									title: levelMayBeInvalid
										? sprintf(
												// translators: %d: heading level e.g: "1", "2", "3"
												__(
													'Heading %d (may be invalid)'
												),
												targetLevel
										  )
										: sprintf(
												// translators: %d: heading level e.g: "1", "2", "3"
												__( 'Heading %d' ),
												targetLevel
										  ),
									// Move tooltips above buttons so they don't overlap
									// the help text below.
									tooltipPosition: 'top',
									isActive,
									onClick() {
										onChange( targetLevel );
									},
								};
							} ) }
							aria-describedby={ helpTextId }
						/>
					</Toolbar>
					<p
						id={ helpTextId }
						className="block-library-heading__heading-level-dropdown__help"
					>
						<ExternalLink href="https://www.w3.org/WAI/tutorials/page-structure/headings/">
							{ __( 'Learn about heading levels.' ) }
						</ExternalLink>
					</p>
					{ selectedLevelMayBeInvalid && (
						<HeadingLevelWarning selectedLevel={ selectedLevel } />
					) }
				</>
			) }
		/>
	);
}
