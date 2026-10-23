import type { ReactNode } from 'react';
import { speak } from '@wordpress/a11y';
import { Component, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, EmptyState } from '@wordpress/ui';
import { useCopyToClipboard } from '@wordpress/compose';
import { caution, check, copy } from '@wordpress/icons';
import styles from './style.module.scss';

interface Props {
	children: ReactNode;
}

interface State {
	error: Error | null;
}

const COPY_FEEDBACK_TIMEOUT = 2000;

function CopyErrorButton( { error }: { error: Error } ) {
	// Each successful copy bumps this so the check stays up for a fresh
	// interval, including when Copy error is used again while it is showing.
	const [ copiedTick, setCopiedTick ] = useState( 0 );
	const hasCopied = copiedTick > 0;

	useEffect( () => {
		if ( copiedTick === 0 ) {
			return;
		}
		const timeoutId = setTimeout(
			() => setCopiedTick( 0 ),
			COPY_FEEDBACK_TIMEOUT
		);
		return () => clearTimeout( timeoutId );
	}, [ copiedTick ] );

	const ref = useCopyToClipboard(
		() => error.stack ?? String( error ),
		() => {
			setCopiedTick( ( tick ) => tick + 1 );
			speak( __( 'Copied to clipboard' ) );
		}
	);

	return (
		<Button ref={ ref } variant="outline" tone="brand">
			<Button.Icon icon={ hasCopied ? check : copy } />
			{ __( 'Copy error' ) }
		</Button>
	);
}

/**
 * Contains a failure to one surface, so a screen keeps working around it.
 *
 * Wrapping each surface separately means a stage that throws leaves the
 * navigation, the canvas and the way to save reachable, rather than taking the
 * whole screen down with it.
 */
export default class ErrorBoundary extends Component< Props, State > {
	constructor( props: Props ) {
		super( props );
		this.state = { error: null };
	}

	static getDerivedStateFromError( error: Error ): State {
		return { error };
	}

	render() {
		const { error } = this.state;

		if ( ! error ) {
			return this.props.children;
		}

		return (
			<div className={ styles[ 'error-boundary' ] }>
				<EmptyState.Root>
					<EmptyState.Icon icon={ caution } />
					<EmptyState.Title>
						{ __( 'Something went wrong' ) }
					</EmptyState.Title>
					<EmptyState.Description>
						{ __(
							'This part of the screen could not be displayed. Reloading the page may help.'
						) }
					</EmptyState.Description>
					<EmptyState.Actions>
						<CopyErrorButton error={ error } />
					</EmptyState.Actions>
				</EmptyState.Root>
			</div>
		);
	}
}
