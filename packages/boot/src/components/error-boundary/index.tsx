import type { ReactNode } from 'react';
import { speak } from '@wordpress/a11y';
import { Component, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { EmptyState } from '@wordpress/ui';
import { useCopyToClipboard } from '@wordpress/compose';
import { caution, check, copy, error as errorIcon } from '@wordpress/icons';
import styles from './style.module.scss';

interface Props {
	children: ReactNode;
}

interface State {
	error: Error | null;
}

const COPY_FEEDBACK_TIMEOUT = 2000;

type CopyResult = 'idle' | 'copied' | 'error';

const RESULT_ICON = {
	idle: copy,
	copied: check,
	error: errorIcon,
};

function CopyErrorButton( { error }: { error: Error } ) {
	// Bump the id on every result so a repeat of the same outcome restarts
	// the time the icon stays visible.
	const [ feedback, setFeedback ] = useState< {
		result: CopyResult;
		id: number;
	} >( { result: 'idle', id: 0 } );

	useEffect( () => {
		if ( feedback.result === 'idle' ) {
			return;
		}
		const timeoutId = setTimeout(
			() => setFeedback( { result: 'idle', id: 0 } ),
			COPY_FEEDBACK_TIMEOUT
		);
		return () => clearTimeout( timeoutId );
	}, [ feedback ] );

	function report( result: Exclude< CopyResult, 'idle' >, message: string ) {
		setFeedback( ( current ) => ( {
			result,
			id: current.id + 1,
		} ) );
		speak( message );
	}

	const ref = useCopyToClipboard(
		() => error.stack ?? String( error ),
		() => report( 'copied', __( 'Copied to clipboard' ) ),
		() => report( 'error', __( "Couldn't copy to clipboard." ) )
	);

	return (
		<Button
			__next40pxDefaultSize
			variant="secondary"
			ref={ ref }
			icon={ RESULT_ICON[ feedback.result ] }
		>
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
