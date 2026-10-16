import type { FunctionComponent } from 'react';
import { __ } from '@wordpress/i18n';
import { useClipboardButtonContext } from './context';
import type { ClipboardButtonLabelProps } from './types';

/**
 * A text label that follows copy status. Meant to be rendered inside
 * `ClipboardButton`.
 */
export const ClipboardButtonLabel: FunctionComponent< ClipboardButtonLabelProps > =
	function ClipboardButtonLabel( {
		pending = __( 'Copy' ),
		success = __( 'Copied' ),
	} ) {
		const { status } = useClipboardButtonContext( 'ClipboardButton.Label' );

		return status === 'success' ? success : pending;
	};
