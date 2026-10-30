import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import { renderToString, useEffect, useState } from '@wordpress/element';
import { check, copy, error } from '@wordpress/icons';
import { Button } from '@wordpress/ui';
import type { IconComponent } from './manifest';

const COPY_FEEDBACK_TIMEOUT = 2000;

export function CopySvgButton( { icon }: { icon: IconComponent } ) {
	const [ result, setResult ] = useState< {
		status: 'idle' | 'copied' | 'error';
	} >( { status: 'idle' } );

	useEffect( () => {
		if ( result.status === 'idle' ) {
			return;
		}
		const timeoutId = setTimeout(
			() => setResult( { status: 'idle' } ),
			COPY_FEEDBACK_TIMEOUT
		);
		return () => clearTimeout( timeoutId );
	}, [ result ] );

	const ref = useCopyToClipboard(
		() => renderToString( icon ),
		() => {
			setResult( { status: 'copied' } );
			speak( 'Copied to clipboard' );
		},
		() => {
			setResult( { status: 'error' } );
			speak( "Couldn't copy to clipboard." );
		}
	);

	return (
		<Button ref={ ref } variant="outline" tone="neutral" size="compact">
			<Button.Icon
				icon={ { idle: copy, copied: check, error }[ result.status ] }
			/>
			Copy SVG
		</Button>
	);
}
