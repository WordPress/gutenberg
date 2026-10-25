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
	error: Error | null;
}

function getMessage( title: string ) {
	return {
		title: sprintf(
			/* translators: %s: the panel's title. */
			__( 'The "%s" panel could not be shown' ),
			title
		),
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

	static getDerivedStateFromError( error: Error ): State {
		return { error };
	}

	componentDidCatch() {
		const { title, description } = getMessage( this.props.title );
		speak( `${ title }. ${ description }`, 'assertive' );
	}

	render() {
		if ( ! this.state.error ) {
			return this.props.children;
		}
		const { title, description } = getMessage( this.props.title );
		return (
			<Notice.Root intent="error">
				<Notice.Title>{ title }</Notice.Title>
				<Notice.Description>{ description }</Notice.Description>
			</Notice.Root>
		);
	}
}
