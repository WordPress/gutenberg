/**
 * Props of `BlockQuickNavigation`.
 */
export interface BlockQuickNavigationProps {
	clientIds: string[];
	onSelect?: ( clientId: string ) => void;
	onSwitchToListView?: ( clientId: string ) => void;
	hasListViewTab?: boolean;
}

/**
 * Props of one block in the quick navigation.
 */
export interface BlockQuickNavigationItemProps extends Omit<
	BlockQuickNavigationProps,
	'clientIds'
> {
	clientId: string;
}
