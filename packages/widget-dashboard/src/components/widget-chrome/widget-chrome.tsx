/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef, useId, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plugins } from '@wordpress/icons';
import { Card, Icon, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { WidgetContextProvider } from '../../context/widget-context';
import { LoadingOverlay, WidgetFrame } from '../widget-frame';
import styles from './widget-chrome.module.css';
import type { DashboardWidget } from '../../types';

interface UnavailableWidgetProps {
	widgetTypeName: string;
}

function UnavailableWidget( { widgetTypeName }: UnavailableWidgetProps ) {
	return (
		<>
			<Card.Header>
				<span
					className={ styles.widgetChromeHeaderIcon }
					aria-hidden="true"
				>
					<Icon icon={ plugins } />
				</span>
			</Card.Header>
			<Card.Content className={ styles.widgetChromeContent }>
				<Stack
					direction="column"
					justify="center"
					align="center"
					gap="md"
					className={ styles.unavailable }
				>
					<Text>{ __( 'Widget is no longer available.' ) }</Text>
					<Text render={ <code /> }>{ widgetTypeName }</Text>
				</Stack>
			</Card.Content>
		</>
	);
}

export interface WidgetChromeProps {
	widget: DashboardWidget< unknown >;
	index: number;
	/**
	 * Lifted by `@wordpress/grid` into a sibling slot outside `Card.Root`, so
	 * it stays interactive while edit mode makes the chrome `inert`.
	 */
	actionableArea?: ReactNode;
	className?: string;
}

/**
 * Dashboard chrome: wraps `WidgetFrame` in the grid tile's `Card.Root`, owning
 * identity, edit-mode `inert`, and the missing/resolving states.
 */
export const WidgetChrome = forwardRef< HTMLDivElement, WidgetChromeProps >(
	function WidgetChrome( { widget, index, className }, ref ) {
		const { widgetTypes, isResolvingWidgetTypes, editMode } =
			useDashboardInternalContext();
		const widgetType = widgetTypes.find( ( t ) => t.name === widget.type );
		const titleId = useId();

		const contextValue = useMemo(
			() => ( {
				uuid: widget.uuid,
				name: widget.type,
				index,
			} ),
			[ widget.uuid, widget.type, index ]
		);

		if ( ! widgetType ) {
			if ( isResolvingWidgetTypes ) {
				return (
					<WidgetContextProvider value={ contextValue }>
						<Card.Root
							render={ <section /> }
							ref={ ref }
							className={ clsx( styles.widgetChrome, className ) }
							aria-busy="true"
							aria-label={ __( 'Loading' ) }
						>
							<Card.Content
								className={ styles.widgetChromeContent }
							>
								<LoadingOverlay />
							</Card.Content>
						</Card.Root>
					</WidgetContextProvider>
				);
			}

			return (
				<WidgetContextProvider value={ contextValue }>
					<Card.Root
						render={ <section /> }
						ref={ ref }
						className={ clsx( styles.widgetChrome, className ) }
						aria-label={ __( 'Missing widget' ) }
					>
						<UnavailableWidget widgetTypeName={ widget.type } />
					</Card.Root>
				</WidgetContextProvider>
			);
		}

		return (
			<WidgetContextProvider value={ contextValue }>
				<Card.Root
					render={ <section /> }
					ref={ ref }
					className={ clsx( styles.widgetChrome, className ) }
					aria-labelledby={ widgetType.title ? titleId : undefined }
					{ ...( editMode ? { inert: 'true' } : {} ) }
				>
					<WidgetFrame
						widget={ widget }
						widgetType={ widgetType }
						titleId={ titleId }
					/>
				</Card.Root>
			</WidgetContextProvider>
		);
	}
);
