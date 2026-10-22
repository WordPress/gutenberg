import { useEffect, useRef, useState } from '@wordpress/element';
import { check, copySmall } from '@wordpress/icons';
import {
	// Storybook documentation only, which does not run in a WordPress environment.
	// eslint-disable-next-line @wordpress/use-recommended-components
	Button,
	Icon,
	Tooltip,
} from '@wordpress/ui';
import styles from './copy-token-button.module.css';

const COPIED_DURATION_MS = 2000;

const visuallyHiddenStyle = {
	position: 'absolute',
	width: 1,
	height: 1,
	overflow: 'hidden',
	clipPath: 'inset(50%)',
	whiteSpace: 'nowrap',
} as const;

/**
 * Copies text with the Clipboard API, falling back to `execCommand` where
 * clipboard access is denied (for example in some embedded frames).
 *
 * @param text Text to copy.
 * @return Whether the text was copied.
 */
async function copyText( text: string ) {
	try {
		await navigator.clipboard.writeText( text );
		return true;
	} catch {
		const textarea = document.createElement( 'textarea' );
		textarea.value = text;
		textarea.setAttribute( 'readonly', '' );
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.appendChild( textarea );
		textarea.select();
		try {
			return document.execCommand( 'copy' );
		} catch {
			return false;
		} finally {
			textarea.remove();
		}
	}
}

/**
 * Icon button that copies a token as a `var()` reference. It is revealed when
 * its token row is hovered or focused (see the `data-token-row` attribute),
 * and briefly confirms the copy visually, in its tooltip, and with a polite
 * live-region announcement.
 *
 * @param props
 * @param props.name        Token CSS custom property name.
 * @param props.describedBy Id of the element naming the token, so that the
 *                          otherwise identical "Copy to clipboard" buttons are told apart.
 */
export function CopyTokenButton( {
	name,
	describedBy,
}: {
	name: string;
	describedBy: string;
} ) {
	const [ copied, setCopied ] = useState( false );
	const timeoutRef = useRef< ReturnType< typeof setTimeout > | undefined >(
		undefined
	);

	useEffect( () => () => clearTimeout( timeoutRef.current ), [] );

	const label = copied ? 'Copied' : 'Copy to clipboard';

	const onClick = async () => {
		if ( ! ( await copyText( `var(${ name })` ) ) ) {
			// Do not claim success when nothing was copied.
			return;
		}
		setCopied( true );
		clearTimeout( timeoutRef.current );
		timeoutRef.current = setTimeout(
			() => setCopied( false ),
			COPIED_DURATION_MS
		);
	};

	return (
		<>
			<Tooltip.Root>
				{ /* Keep the tooltip open on click so it can show "Copied". */ }
				<Tooltip.Trigger
					closeOnClick={ false }
					className={ styles.button }
					render={
						<Button
							data-copied={ copied || undefined }
							variant="minimal"
							tone="neutral"
							size="small"
							aria-label={ label }
							aria-describedby={ describedBy }
							onClick={ onClick }
						/>
					}
				>
					<Icon
						icon={ copied ? check : copySmall }
						size={ 24 }
						className={ styles.icon }
					/>
				</Tooltip.Trigger>
				<Tooltip.Popup>{ label }</Tooltip.Popup>
			</Tooltip.Root>
			<span role="status" style={ visuallyHiddenStyle }>
				{ copied ? 'Copied' : '' }
			</span>
		</>
	);
}
