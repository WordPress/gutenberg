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

	const [ { result, attempt }, setFeedback ] = useState< {
		result: CopyResult;
		attempt: number;
	} >( { result: 'idle', attempt: 0 } );

	useEffect( () => {
		if ( result === 'idle' ) {
			return;
		}
		const timeoutId = setTimeout(
			() =>
				setFeedback( ( current ) => ( {
					...current,
					result: 'idle',
				} ) ),
			FEEDBACK_TIMEOUT
		);
		return () => clearTimeout( timeoutId );
	}, [ result, attempt ] );

	function report(
		nextResult: Exclude< CopyResult, 'idle' >,
		message: string
	) {
		setFeedback( ( current ) => ( {
			result: nextResult,
			attempt: current.attempt + 1,
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
			icon={ RESULT_ICON[ result ] }
			variant="minimal"
			tone="neutral"
			size="compact"
		/>
	);
};
