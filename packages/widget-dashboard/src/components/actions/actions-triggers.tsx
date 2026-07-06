/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { layout as layoutIcon, plus } from '@wordpress/icons';
import { store as viewportStore } from '@wordpress/viewport';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';
import styles from './actions.module.css';

// @TODO: switch to using Admin UI declaratively for mobile viewport support once available.
// https://github.com/WordPress/gutenberg/issues/77628
function useIsMobileViewport(): boolean {
	return useSelect(
		( select ) => select( viewportStore ).isViewportMatch( '< small' ),
		[]
	);
}

/**
 * Trigger that opens the widget inserter.
 */
export function AddWidget(): React.ReactNode {
	const { setInserterOpen } = useDashboardUIContext();
	const isMobileViewport = useIsMobileViewport();

	const insert = useCallback( () => {
		setInserterOpen( true );
	}, [ setInserterOpen ] );

	return (
		<Button
			variant="minimal"
			tone="brand"
			size="compact"
			onClick={ insert }
		>
			{ ! isMobileViewport && <Button.Icon icon={ plus } /> }
			{ __( 'Add widget' ) }
		</Button>
	);
}

/**
 * Trigger that opens the layout-settings editor. Hidden when grid settings
 * are not editable.
 */
export function LayoutSettings(): React.ReactNode {
	const { canEditGridSettings } = useDashboardInternalContext();
	const { setLayoutSettingsOpen } = useDashboardUIContext();
	const isMobileViewport = useIsMobileViewport();

	const open = useCallback( () => {
		setLayoutSettingsOpen( true );
	}, [ setLayoutSettingsOpen ] );

	if ( ! canEditGridSettings ) {
		return null;
	}

	return (
		<Button variant="minimal" tone="brand" size="compact" onClick={ open }>
			{ ! isMobileViewport && <Button.Icon icon={ layoutIcon } /> }
			{ __( 'Layout settings' ) }
		</Button>
	);
}

/**
 * Vertical rule separating trigger clusters in the customize toolbar.
 */
export function Divider(): React.ReactNode {
	return <div className={ styles.editActionsDivider } aria-hidden="true" />;
}

/**
 * Trigger that discards staged edits and exits customize mode.
 */
export function Cancel(): React.ReactNode {
	const { cancel: cancelStaging } = useDashboardInternalContext();

	const cancel = useCallback( () => {
		cancelStaging();
	}, [ cancelStaging ] );

	return (
		<Button
			variant="minimal"
			tone="brand"
			size="compact"
			onClick={ cancel }
		>
			{ __( 'Cancel' ) }
		</Button>
	);
}

/**
 * Trigger that publishes staged edits and exits customize mode. Disabled
 * while staging matches the committed state.
 */
export function Done(): React.ReactNode {
	const { commit, hasUncommittedChanges } = useDashboardInternalContext();

	const done = useCallback( () => {
		commit();
	}, [ commit ] );

	return (
		<Button
			variant="solid"
			tone="brand"
			size="compact"
			onClick={ done }
			disabled={ ! hasUncommittedChanges }
		>
			{ __( 'Done' ) }
		</Button>
	);
}
