/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { Component, Suspense } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Card, Notice, Stack, VisuallyHidden } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { WidgetHeader } from '../widget-header';
import { WidgetRender } from '../widget-render';
import styles from './widget-frame.module.css';
import type { DashboardWidget } from '../../types';

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
}

class WidgetErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	render() {
		if ( this.state.hasError ) {
			return (
				<Notice.Root intent="error">
					<Notice.Description>
						{ __( 'This widget encountered an error.' ) }
					</Notice.Description>
				</Notice.Root>
			);
		}
		return this.props.children;
	}
}

/* Centered spinner for resolving and Suspense waits. */
export function LoadingOverlay() {
	return (
		<Stack justify="center" align="center" className={ styles.loading }>
			<Spinner />
		</Stack>
	);
}

export interface WidgetFrameProps {
	widget: DashboardWidget< unknown >;
	widgetType: WidgetType;
	titleId: string;
}

/**
 * Shared framing: `presentation` into header + content, with the error/loading
 * boundaries. Hosts supply the `Card.Root` and their own concerns.
 *
 * @param {WidgetFrameProps} props Component props.
 */
export function WidgetFrame( {
	widget,
	widgetType,
	titleId,
}: WidgetFrameProps ) {
	// full-bleed hides the header; full-bleed and content-bleed bleed the body.
	const { presentation } = widgetType;
	const isHeaderHidden = presentation === 'full-bleed';
	const isBodyBleeding =
		presentation === 'full-bleed' || presentation === 'content-bleed';

	const body = (
		<WidgetErrorBoundary>
			<Suspense fallback={ <LoadingOverlay /> }>
				<WidgetRender widget={ widget } widgetType={ widgetType } />
			</Suspense>
		</WidgetErrorBoundary>
	);

	return (
		<>
			{ ! isHeaderHidden && (
				<WidgetHeader
					showIdentity
					widgetType={ widgetType }
					titleId={ titleId }
				/>
			) }

			<Card.Content
				className={ clsx(
					styles.content,
					isBodyBleeding && styles.bleedContent
				) }
			>
				{ isHeaderHidden && widgetType.title && (
					<VisuallyHidden render={ <h2 id={ titleId } /> }>
						{ widgetType.title }
					</VisuallyHidden>
				) }
				{ body }
			</Card.Content>
		</>
	);
}
