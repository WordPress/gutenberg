/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import { useContextSystem, contextConnect } from '../context';
// eslint-disable-next-line no-duplicate-imports
import type { PolymorphicComponentProps } from '../context';
import { View } from '../../view';

export interface ShortcutDescription {
	display: string;
	ariaLabel: string;
}

export interface Props {
	shortcut?: ShortcutDescription | string;
	className?: string;
}

function Shortcut(
	props: PolymorphicComponentProps< Props, 'span' >,
	forwardedRef: Ref< any >
): JSX.Element | null {
	const {
		as: asProp = 'span',
		shortcut,
		className,
		...otherProps
	} = useContextSystem( props, 'Shortcut' );
	if ( ! shortcut ) {
		return null;
	}

	let displayText: string;
	let ariaLabel: string | undefined;

	if ( typeof shortcut === 'string' ) {
		displayText = shortcut;
	} else {
		displayText = shortcut.display;
		ariaLabel = shortcut.ariaLabel;
	}

	return (
		<View
			as={ asProp }
			className={ className }
			aria-label={ ariaLabel }
			ref={ forwardedRef }
			{ ...otherProps }
		>
			{ displayText }
		</View>
	);
}

const ConnectedShortcut = contextConnect( Shortcut, 'Shortcut' );

export default ConnectedShortcut;
