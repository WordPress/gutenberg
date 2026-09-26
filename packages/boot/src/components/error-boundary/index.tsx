import type { ReactNode } from 'react';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { EmptyState } from '@wordpress/ui';
import { useCopyToClipboard } from '@wordpress/compose';
import { caution } from '@wordpress/icons';
import styles from './style.module.scss';

interface Props {
	children: ReactNode;
}

interface State {
	error: Error | null;
}

function CopyErrorButton( { error }: { error: Error } ) {
	const ref = useCopyToClipboard( () => error.stack ?? String( error ) );

	return (
		<Button __next40pxDefaultSize variant="secondary" ref={ ref }>
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
