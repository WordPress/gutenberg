import { speak } from '@wordpress/a11y';
import { Button } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, copySmall } from '@wordpress/icons';
import { Collapsible } from '@wordpress/ui';

const COPIED_TIMEOUT = 3000;

/**
 * Puts the failure, message and detail together, on the clipboard.
 *
 * A save failure is one of the moments where someone reaches for a search
 * engine or an assistant, and retyping a server message by hand is where that
 * stops being worth doing.
 *
 * @param props
 * @param props.text The text to copy.
 */
function CopyErrorButton( { text }: { text: string } ) {
	const [ hasCopied, setHasCopied ] = useState( false );
	const timeoutIdRef = useRef< ReturnType< typeof setTimeout > >( undefined );
	const ref = useCopyToClipboard< HTMLButtonElement >( text, () => {
		setHasCopied( true );
		// The button holds focus once it is clicked, and changing the
		// accessible name of the focused element is announced inconsistently.
		// The name stays put: the icon confirms the copy on screen and the
		// live region confirms it off screen.
		speak( __( 'Error copied to clipboard.' ) );
		clearTimeout( timeoutIdRef.current );
		timeoutIdRef.current = setTimeout(
			() => setHasCopied( false ),
			COPIED_TIMEOUT
		);
	} );

	useEffect( () => {
		return () => clearTimeout( timeoutIdRef.current );
	}, [] );

	return (
		<Button
			className="editor-save-error-details__copy"
			size="compact"
			label={ __( 'Copy error' ) }
			icon={ hasCopied ? check : copySmall }
			ref={ ref }
		/>
	);
}

type SaveErrorDetailsProps = {
	/**
	 * The notice's own message.
	 */
	message: string;
	/**
	 * What the server said went wrong, as plain text, or `null` when the
	 * failure carried nothing the message doesn't already say.
	 */
	detail: string | null;
};

/**
 * Offers a save failure for copying, and discloses what the server said about
 * it when there is more to say.
 *
 * Every failure is copyable, detail or not: the message alone is still what
 * someone pastes into a search or an assistant.
 *
 * @param props
 * @param props.message The notice's own message.
 * @param props.detail  What the server said went wrong, or `null`.
 */
export default function SaveErrorDetails( {
	message,
	detail,
}: SaveErrorDetailsProps ) {
	const [ isOpen, setIsOpen ] = useState( false );

	// Nothing to disclose: the button joins the end of the message rather than
	// standing on a row of its own beneath a single sentence.
	if ( ! detail ) {
		return (
			<span className="editor-save-error-details__inline">
				<CopyErrorButton text={ message } />
			</span>
		);
	}

	return (
		<Collapsible.Root
			className="editor-save-error-details"
			open={ isOpen }
			onOpenChange={ setIsOpen }
		>
			<div className="editor-save-error-details__actions">
				<Collapsible.Trigger
					render={ <Button variant="secondary" size="compact" /> }
				>
					{ isOpen ? __( 'Hide details' ) : __( 'Show details' ) }
				</Collapsible.Trigger>
				<CopyErrorButton text={ `${ message }\n\n${ detail }` } />
			</div>
			{ /* Kept in the document while collapsed, so that a browser's
			     find-in-page can still turn up what the server said. */ }
			<Collapsible.Panel hiddenUntilFound>
				<p className="editor-save-error-details__message">{ detail }</p>
			</Collapsible.Panel>
		</Collapsible.Root>
	);
}
