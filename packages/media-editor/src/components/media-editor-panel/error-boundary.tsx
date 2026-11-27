import { Component } from '@wordpress/element';
import { speak } from '@wordpress/a11y';
import { __, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import type { ReactNode } from 'react';

interface Props {
	/** The panel's title, which the message names. */
	title: string;
	children: ReactNode;
}

interface State {
	error: unknown;
}

function getMessage( title: string, error: unknown ) {
	// A boundary catches whatever was thrown, which is not always an `Error`.
	const message =
		typeof error === 'string'
			? error
			: ( error as { message?: unknown } | null )?.message;
	return {
		title: sprintf(
			/* translators: %s: the panel's title. */
			__( 'The "%s" panel could not be shown' ),
			title
		),
		// The panel's own words for what went wrong, when it gave any.
		cause: typeof message === 'string' ? message.trim() : '',
		description: __(
			'The rest of the editor keeps working. Reloading the page may help.'
		),
	};
}

/**
 * Keeps a panel's failure inside its tab, so the canvas, the other tabs and
 * saving stay usable and the tab names the panel that failed.
 */
export default class MediaEditorPanelErrorBoundary extends Component<
	Props,
	State
> {
	state: State = { error: null };

	static getDerivedStateFromError( error: unknown ): State {
		return { error };
	}

	componentDidCatch( error: unknown ) {
		const { title, cause, description } = getMessage(
			this.props.title,
			error
		);
		speak(
			[ `${ title }.`, cause, description ].filter( Boolean ).join( ' ' ),
			'assertive'
		);
	}

	render() {
		if ( ! this.state.error ) {
			return this.props.children;
		}
		const { title, cause, description } = getMessage(
			this.props.title,
			this.state.error
		);
		return (
			<Notice.Root intent="error">
				<Notice.Title>{ title }</Notice.Title>
				{ cause && <Notice.Description>{ cause }</Notice.Description> }
				<Notice.Description>{ description }</Notice.Description>
			</Notice.Root>
		);
	}
}
