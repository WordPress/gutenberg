import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';

// How long the confirmation stays after a successful copy.
const CONFIRMATION_TIMEOUT = 4000;

type CopyButtonProps = {
	/**
	 * The text to put on the clipboard.
	 */
	text: string;

	/**
	 * The button's label, which stays the same after copying.
	 */
	label: string;
};

export default function CopyButton( { text, label }: CopyButtonProps ) {
	const [ hasCopied, setHasCopied ] = useState( false );
	const ref = useCopyToClipboard< HTMLButtonElement >( text, () =>
		setHasCopied( true )
	);

	// A confirmation applies to the text that was copied, so it goes away
	// when the text changes.
	useEffect( () => {
		setHasCopied( false );
	}, [ text ] );

	useEffect( () => {
		if ( ! hasCopied ) {
			return;
		}
		const timeoutId = setTimeout(
			() => setHasCopied( false ),
			CONFIRMATION_TIMEOUT
		);
		return () => clearTimeout( timeoutId );
	}, [ hasCopied ] );

	return (
		<>
			<Notice.ActionButton ref={ ref } variant="outline">
				{ label }
			</Notice.ActionButton>
			{ /*
			 * The region stays mounted, so screen readers announce the
			 * confirmation when it fills in. It is the only announcement of
			 * the copy. It is a description so it has the notice's text color.
			 */ }
			<Notice.Description
				role="status"
				className="notices-inline-notices__copy-status"
			>
				{ hasCopied ? __( 'Copied' ) : '' }
			</Notice.Description>
		</>
	);
}
