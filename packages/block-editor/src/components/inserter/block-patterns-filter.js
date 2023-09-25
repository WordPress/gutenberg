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
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { myPatternsCategory } from './block-patterns-tab';

export const PATTERN_TYPES = {
	all: 'all',
	synced: 'synced',
	unsynced: 'unsynced',
	user: 'user',
	theme: 'theme',
	directory: 'directory',
};

export const SYNC_TYPES = {
	all: 'all',
	full: 'fully',
	unsynced: 'unsynced',
};

const getShouldDisableSyncFilter = ( sourceFilter ) =>
	sourceFilter !== PATTERN_TYPES.all && sourceFilter !== PATTERN_TYPES.user;

const getShouldDisableNonUserSources = ( category ) => {
	return category.name === myPatternsCategory.name;
};

export function BlockPatternsSyncFilter( {
	setPatternSyncFilter,
	setPatternSourceFilter,
	patternSyncFilter,
	patternSourceFilter,
	scrollContainerRef,
	category,
} ) {
	// We need to disable the sync filter option if the source filter is not 'all' or 'user'
	// otherwise applying them will just result in no patterns being shown.
	const shouldDisableSyncFilter =
		getShouldDisableSyncFilter( patternSourceFilter );

	// We also need to disable the directory and theme source filter options if the category
	// is `myPatterns` otherwise applying them will also just result in no patterns being shown.
	const shouldDisableNonUserSources =
		getShouldDisableNonUserSources( category );

	const patternSyncMenuOptions = useMemo(
		() => [
			{ value: SYNC_TYPES.all, label: __( 'All' ) },
			{
				value: SYNC_TYPES.full,
				label: __( 'Synced' ),
				info: __( 'Updated everywhere' ),
				disabled: shouldDisableSyncFilter,
			},
			{
				value: SYNC_TYPES.unsynced,
				label: __( 'Standard' ),
				info: __( 'Edit freely' ),
				disabled: shouldDisableSyncFilter,
			},
		],
		[ shouldDisableSyncFilter ]
	);

	const patternSourceMenuOptions = useMemo(
		() => [
			{
				value: PATTERN_TYPES.all,
				label: __( 'All' ),
				disabled: shouldDisableNonUserSources,
			},
			{
				value: PATTERN_TYPES.directory,
				label: __( 'Directory' ),
				info: __( 'Pattern directory & core' ),
				disabled: shouldDisableNonUserSources,
			},
			{
				value: PATTERN_TYPES.theme,
				label: __( 'Theme' ),
				info: __( 'Bundled with the theme' ),
				disabled: shouldDisableNonUserSources,
			},
			{
				value: PATTERN_TYPES.user,
				label: __( 'User' ),
				info: __( 'Custom created' ),
			},
		],
		[ shouldDisableNonUserSources ]
	);

	function handleSetSourceFilterChange( newSourceFilter ) {
		setPatternSourceFilter( newSourceFilter );
		if ( getShouldDisableSyncFilter( newSourceFilter ) ) {
			setPatternSyncFilter( SYNC_TYPES.all );
		}
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
								choices={ patternSourceMenuOptions }
								onSelect={ ( value ) => {
									handleSetSourceFilterChange( value );
									scrollContainerRef.current?.scrollTo(
										0,
										0
									);
								} }
								value={ patternSourceFilter }
							/>
						</MenuGroup>
						<MenuGroup label={ __( 'Type' ) }>
							<MenuItemsChoice
								choices={ patternSyncMenuOptions }
								onSelect={ ( value ) => {
									setPatternSyncFilter( value );
									scrollContainerRef.current?.scrollTo(
										0,
										0
									);
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
