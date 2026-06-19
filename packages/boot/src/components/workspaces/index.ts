/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
// @ts-ignore - Preferences package is not typed.
import { store as preferencesStore } from '@wordpress/preferences';

const PREFERENCE_SCOPE = 'wordpress/boot';
const PREFERENCE_KEY = 'activeWorkspace';

export type WorkspaceId = 'default' | 'theme-developer';

export interface WorkspaceConfig {
	id: WorkspaceId;
	label: string;
	navigationPreferenceKey: string;
	promotedNavigationItemIds: string[];
}

const WORKSPACES: WorkspaceConfig[] = [
	{
		id: 'default',
		label: __( 'Default' ),
		navigationPreferenceKey: 'sidebarNavigation',
		promotedNavigationItemIds: [],
	},
	{
		id: 'theme-developer',
		label: __( 'Theme Developer' ),
		navigationPreferenceKey: 'sidebarNavigationThemeDeveloper',
		promotedNavigationItemIds: [ 'patterns', 'templates', 'templateParts' ],
	},
];

const DEFAULT_WORKSPACE = WORKSPACES[ 0 ];

function getWorkspaceById( workspaceId: unknown ) {
	return (
		WORKSPACES.find( ( workspace ) => workspace.id === workspaceId ) ??
		DEFAULT_WORKSPACE
	);
}

export function useActiveWorkspace() {
	const savedWorkspaceId = useSelect(
		( select ) =>
			select( preferencesStore ).get( PREFERENCE_SCOPE, PREFERENCE_KEY ),
		[]
	);
	const { set } = useDispatch( preferencesStore );
	const activeWorkspace = useMemo(
		() => getWorkspaceById( savedWorkspaceId ),
		[ savedWorkspaceId ]
	);
	const setActiveWorkspace = useCallback(
		( workspaceId: WorkspaceId ) => {
			set( PREFERENCE_SCOPE, PREFERENCE_KEY, workspaceId );
		},
		[ set ]
	);

	return {
		activeWorkspace,
		setActiveWorkspace,
		workspaces: WORKSPACES,
	};
}
