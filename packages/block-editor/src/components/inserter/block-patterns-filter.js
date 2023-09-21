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
import { useState } from '@wordpress/element';

export const PATTERN_TYPES = {
	all: 'all',
	synced: 'synced',
	unsynced: 'unsynced',
	user: 'user',
	theme: 'theme',
	directory: 'directory',
};

const patternSourceOptions = [
	{ value: PATTERN_TYPES.all, label: __( 'All' ) },
	{
		value: PATTERN_TYPES.directory,
		label: __( 'Directory' ),
		info: __( 'Pattern directory & core' ),
	},
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

export const SYNC_TYPES = {
	all: 'all',
	full: 'fully',
	unsynced: 'unsynced',
};

const patternSyncOptions = [
	{ value: SYNC_TYPES.all, label: __( 'All' ) },
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
	const [ patternSyncMenuOptions, setPatternSyncMenuOptions ] =
		useState( patternSyncOptions );

	function handleSetSourceFilterChange( newSourceFilter ) {
		setPatternSourceFilter( newSourceFilter );
		// We need to disable the sync filter option if the source filter is not 'all' or 'user'
		// otherwise applying them will just result in no patterns being shown.
		if (
			newSourceFilter !== PATTERN_TYPES.all &&
			newSourceFilter !== PATTERN_TYPES.user
		) {
			setPatternSyncMenuOptions(
				patternSyncOptions.map( ( item ) => {
					if ( item.value !== SYNC_TYPES.all ) {
						return { ...item, disabled: true };
					}
					return item;
				} )
			);
			setPatternSyncFilter( SYNC_TYPES.all );
			return;
		}
		setPatternSyncMenuOptions( patternSyncOptions );
	}

	return (
		<>
			<DropdownMenu
				popoverProps={ {
					placement: 'right-end',
				} }
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
				{ () => (
					<>
						<MenuGroup label={ __( 'Author' ) }>
							<MenuItemsChoice
								choices={ patternSourceOptions }
								onSelect={ ( value ) => {
									handleSetSourceFilterChange( value );
								} }
								value={ patternSourceFilter }
							/>
						</MenuGroup>
						<MenuGroup label={ __( 'Type' ) }>
							<MenuItemsChoice
								choices={ patternSyncMenuOptions }
								onSelect={ ( value ) => {
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
