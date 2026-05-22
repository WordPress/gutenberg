/**
 * WordPress dependencies
 */
import { DataForm } from '@wordpress/dataviews';
import type { Field, Form } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// Dashboard is still experimental.
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, Drawer } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';
import { getWidgetSettingsTitle } from './utils';
import styles from './widget-settings.module.css';

type WidgetAttributes = Record< string, unknown >;

/**
 * Single side drawer that edits one instance's attributes, mounted once
 * at the dashboard root next to the inserter. It reads the active
 * instance from `settingsWidgetUuid` in the UI context (set by the
 * per-instance gear in the chrome) and renders the type's declarative
 * `attributes` straight through `DataForm`, with no per-widget form
 * wiring.
 *
 * Edits write to the dashboard's staging layer (the same buffer that
 * `setAttributes` and the layout toolbar use), so changes preview live
 * behind the drawer and are published on Save or rolled back on any other
 * exit. The flow is normal-mode only: the chrome hides the gear while the
 * layout is being edited, keeping the shared commit free of cross-flow
 * edits.
 *
 * The drawer stays mounted and toggles through `open` (rather than
 * unmounting) so it slides in and out like the layout-settings drawer; the
 * last opened instance is retained while it animates closed so the form
 * doesn't blank out mid-transition. It enters from `settingsDrawerSide`,
 * the edge away from the widget, to avoid covering it.
 *
 * @return {React.ReactNode} The settings drawer.
 */
export function WidgetSettings(): React.ReactNode {
	const {
		layout,
		onLayoutChange,
		widgetTypes,
		commit,
		cancel: cancelStaging,
		hasUncommittedChanges,
	} = useDashboardInternalContext();
	const {
		settingsWidgetUuid,
		setSettingsWidgetUuid,
		settingsDrawerSide,
		settingsDrawerInset,
	} = useDashboardUIContext();

	const open = settingsWidgetUuid !== null;

	// Keep the last opened instance resolved while the drawer animates
	// closed so its form and title don't blank out mid-transition. While
	// open the live `settingsWidgetUuid` wins, so opening shows no stale
	// frame.
	const [ lastWidgetUuid, setLastWidgetUuid ] = useState< string | null >(
		settingsWidgetUuid
	);
	useEffect( () => {
		if ( settingsWidgetUuid ) {
			setLastWidgetUuid( settingsWidgetUuid );
		}
	}, [ settingsWidgetUuid ] );

	const activeUuid = settingsWidgetUuid ?? lastWidgetUuid;
	const widget = activeUuid
		? layout.find( ( instance ) => instance.uuid === activeUuid )
		: undefined;
	const widgetType = widget
		? widgetTypes.find( ( type ) => type.name === widget.type )
		: undefined;

	const fields = useMemo< Field< WidgetAttributes >[] >(
		() => ( widgetType?.attributes ?? [] ) as Field< WidgetAttributes >[],
		[ widgetType?.attributes ]
	);

	const form = useMemo< Form >(
		() => ( {
			layout: { type: 'regular', labelPosition: 'top' },
			fields: fields.map( ( field ) => field.id ),
		} ),
		[ fields ]
	);

	const handleChange = useCallback(
		( edits: Record< string, unknown > ) => {
			if ( ! widget ) {
				return;
			}
			onLayoutChange(
				layout.map( ( instance ) =>
					instance.uuid === widget.uuid
						? {
								...instance,
								attributes: {
									...( instance.attributes as object ),
									...edits,
								},
						  }
						: instance
				)
			);
		},
		[ layout, onLayoutChange, widget ]
	);

	const close = useCallback(
		() => setSettingsWidgetUuid( null ),
		[ setSettingsWidgetUuid ]
	);

	const handleSave = useCallback( () => {
		commit();
		close();
	}, [ commit, close ] );

	const handleOpenChange = useCallback(
		( nextOpen: boolean ) => {
			// Any path out of the drawer other than Save discards the
			// staged edits, matching the layout-settings drawer.
			if ( ! nextOpen ) {
				cancelStaging();
				close();
			}
		},
		[ cancelStaging, close ]
	);

	// For a left drawer, clear the fixed admin menu on the inline-start
	// edge so the drawer lands beside it. The admin bar at the top is
	// cleared in the CSS module.
	const popupStyle = useMemo< React.CSSProperties >(
		() =>
			settingsDrawerSide === 'left' && settingsDrawerInset > 0
				? { marginLeft: settingsDrawerInset }
				: {},
		[ settingsDrawerSide, settingsDrawerInset ]
	);

	const hasForm = !! widget && !! widgetType && fields.length > 0;

	if ( ! hasForm ) {
		return null;
	}

	const title = getWidgetSettingsTitle( widgetType );
	const data = ( widget?.attributes ??
		widgetType?.example?.attributes ??
		{} ) as WidgetAttributes;

	return (
		<Drawer.Root
			open={ open }
			onOpenChange={ handleOpenChange }
			swipeDirection={ settingsDrawerSide }
			modal={ false }
			disablePointerDismissal
		>
			<Drawer.Popup
				size="medium"
				className={ styles.popup }
				style={ popupStyle }
			>
				<Drawer.Header>
					<Drawer.Title>{ title }</Drawer.Title>
					<Drawer.CloseIcon />
				</Drawer.Header>

				<Drawer.Content>
					<DataForm< WidgetAttributes >
						data={ data }
						fields={ fields }
						form={ form }
						onChange={ handleChange }
					/>
				</Drawer.Content>

				<Drawer.Footer>
					<Button
						variant="minimal"
						tone="brand"
						size="compact"
						onClick={ () => handleOpenChange( false ) }
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="solid"
						tone="brand"
						size="compact"
						onClick={ handleSave }
						disabled={ ! hasUncommittedChanges }
					>
						{ __( 'Save' ) }
					</Button>
				</Drawer.Footer>
			</Drawer.Popup>
		</Drawer.Root>
	);
}
