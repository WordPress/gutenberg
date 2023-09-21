/**
 * WordPress dependencies
 */
import {
	SVG,
	Path,
	DropdownMenu,
	MenuGroup,
	MenuItemsChoice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
/**
 * Internal dependencies
 */

export const PATTERN_TYPES = {
	synced: 'synced',
	unsynced: 'unsynced',
	user: 'user',
	theme: 'theme',
};

const patternSourceOptions = [
	{ value: 'all', label: __( 'All' ) },
	{
		value: PATTERN_TYPES.theme,
		label: __( 'Theme' ),
		info: __( 'Bundled with the theme' ),
	},
	{
		value: PATTERN_TYPES.user,
		label: __( 'User' ),
		info: __( 'Custom created' ),
	},
];

export const PATTERN_SOURCE_FILTERS = patternSourceOptions.reduce(
	( patternSourceFilters, { value, label } ) => {
		patternSourceFilters[ value ] = label;
		return patternSourceFilters;
	},
	{}
);

export const SYNC_TYPES = {
	all: 'all',
	full: 'fully',
	unsynced: 'unsynced',
};

const patternSyncOptions = [
	{ value: 'all', label: __( 'All' ) },
	{
		value: SYNC_TYPES.full,
		label: __( 'Synced' ),
		info: __( 'Updated everywhere' ),
	},
	{
		value: SYNC_TYPES.unsynced,
		label: __( 'Standard' ),
		info: __( 'Edit freely' ),
	},
];

export function BlockPatternsSyncFilter( {
	setPatternSyncFilter,
	setPatternSourceFilter,
	patternSyncFilter,
	patternSourceFilter,
} ) {
	return (
		<>
			<DropdownMenu
				label="Filter patterns"
				icon={
					<Icon
						icon={
							<SVG
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<Path
									d="M10 17.5H14V16H10V17.5ZM6 6V7.5H18V6H6ZM8 12.5H16V11H8V12.5Z"
									fill="#1E1E1E"
								/>
							</SVG>
						}
					/>
				}
			>
				{ ( { onClose } ) => (
					<>
						<MenuGroup label={ __( 'Author' ) }>
							<MenuItemsChoice
								choices={ patternSourceOptions }
								onSelect={ ( value ) => {
									onClose();
									setPatternSourceFilter( value );
								} }
								value={ patternSourceFilter }
							/>
						</MenuGroup>
						<MenuGroup label={ __( 'Type' ) }>
							<MenuItemsChoice
								choices={ patternSyncOptions }
								onSelect={ ( value ) => {
									onClose();
									setPatternSyncFilter( value );
								} }
								value={ patternSyncFilter }
							/>
						</MenuGroup>
					</>
				) }
			</DropdownMenu>
		</>
	);
}
