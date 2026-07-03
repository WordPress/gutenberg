/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { info } from '@wordpress/icons';
// Dashboard is still experimental.
/* eslint-disable @wordpress/use-recommended-components */
import {
	Card,
	Icon,
	Link,
	Popover,
	Stack,
	VisuallyHidden,
} from '@wordpress/ui';
/* eslint-enable @wordpress/use-recommended-components */
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import styles from './widget-header.module.css';

export interface WidgetHeaderProps {
	/**
	 * Widget type, source of the icon, title, and help note shown as
	 * identity.
	 */
	widgetType?: WidgetType;

	/**
	 * Id linking the title to the tile's labelled region.
	 */
	titleId?: string;

	/**
	 * Render the icon + title cluster on the leading edge.
	 */
	showIdentity?: boolean;

	/**
	 * Float over the tile instead of sitting in the card flow.
	 */
	overlay?: boolean;

	/**
	 * Inert the identity while customizing, so it does not capture interaction.
	 */
	editMode?: boolean;

	/**
	 * Toolbar placed on the trailing edge.
	 */
	children?: ReactNode;
}

/**
 * Tile header row: identity (icon + title) and a toolbar on one line. Rendered
 * in the card flow, or as an `overlay` in the grid slot for full-bleed widgets
 * that have no in-card header.
 *
 * @param {WidgetHeaderProps} props Component props.
 */
export function WidgetHeader( {
	widgetType,
	titleId,
	showIdentity = false,
	overlay = false,
	editMode = false,
	children,
}: WidgetHeaderProps ): React.ReactNode {
	return (
		<Card.Header
			className={ clsx( styles.widgetHeader, overlay && styles.overlay ) }
		>
			{ showIdentity && widgetType?.title && (
				<Stack
					direction="row"
					align="center"
					gap="sm"
					className={ styles.identity }
					{ ...( editMode ? { inert: 'true' } : {} ) }
				>
					{ widgetType.icon && (
						<span className={ styles.icon } aria-hidden="true">
							<Icon icon={ widgetType.icon } />
						</span>
					) }

					<Card.Title id={ titleId } render={ <h2 /> }>
						{ widgetType.title }
					</Card.Title>

					{ widgetType.help && (
						<Popover.Root modal="trap-focus">
							<Popover.Trigger
								aria-label={ __( 'More information' ) }
								className={ styles.help }
							>
								<Icon icon={ info } size={ 20 } />
							</Popover.Trigger>

							<Popover.Popup
								positioner={
									<Popover.Positioner
										side="bottom"
										align="start"
									/>
								}
							>
								<Popover.Arrow />
								<VisuallyHidden render={ <Popover.Title /> }>
									{ __( 'More information' ) }
								</VisuallyHidden>

								<Stack
									direction="column"
									align="start"
									gap="sm"
								>
									<Popover.Description>
										{ createInterpolateElement(
											widgetType.help.text,
											{
												em: <em />,
												strong: <strong />,
											}
										) }
									</Popover.Description>

									{ widgetType.help.links?.map( ( link ) => (
										<Link
											key={ link.href }
											href={ link.href }
										>
											{ link.label }
										</Link>
									) ) }
								</Stack>
							</Popover.Popup>
						</Popover.Root>
					) }
				</Stack>
			) }

			{ children && <div className={ styles.toolbar }>{ children }</div> }
		</Card.Header>
	);
}
