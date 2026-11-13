import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { check, copy, error } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/ui';
import type { ColorCopyButtonProps } from './types';

const FEEDBACK_TIMEOUT = 2000;

type CopyResult = 'idle' | 'copied' | 'error';

const RESULT_ICON = {
	idle: copy,
	copied: check,
	error,
};

export const ColorCopyButton = ( props: ColorCopyButtonProps ) => {
	const { color, colorType } = props;

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
			FEEDBACK_TIMEOUT
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

	const copyRef = useCopyToClipboard< HTMLButtonElement >(
		() => {
			switch ( colorType ) {
				case 'hsl': {
					return color.toHslString();
				}
				case 'rgb': {
					return color.toRgbString();
				}
				default:
				case 'hex': {
					return color.toHex();
				}
			}
		},
		() => report( 'copied', __( 'Copied to clipboard' ) ),
		() => report( 'error', __( "Couldn't copy to clipboard." ) )
	);

	return (
		<IconButton
			ref={ copyRef }
			label={ __( 'Copy' ) }
			icon={ RESULT_ICON[ feedback.result ] }
			variant="minimal"
			tone="neutral"
			size="compact"
		/>
	);
};
