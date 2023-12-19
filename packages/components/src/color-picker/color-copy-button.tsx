/**
 * WordPress dependencies
 */
import { useCopyToClipboard } from '@wordpress/compose';
import { useState, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { ColorCopyButtonProps } from './types';
import { Button } from '../button';

export const ColorCopyButton = ( props: ColorCopyButtonProps ) => {
	const { color, colorType } = props;
	const [ copiedColor, setCopiedColor ] = useState< string | null >( null );
	const copyTimer = useRef< ReturnType< typeof setTimeout > | undefined >();
	const copyRef = useCopyToClipboard< HTMLDivElement >(
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
		() => {
			if ( copyTimer.current ) {
				clearTimeout( copyTimer.current );
			}
			setCopiedColor( color.toHex() );
			copyTimer.current = setTimeout( () => {
				setCopiedColor( null );
				copyTimer.current = undefined;
			}, 3000 );
		}
	);
	useEffect( () => {
		// Clear copyTimer on component unmount.
		return () => {
			if ( copyTimer.current ) {
				clearTimeout( copyTimer.current );
			}
		};
	}, [] );

	return (
		<Button variant="secondary" size="small" ref={ copyRef }>
			{ copiedColor === color.toHex() ? __( 'Copied!' ) : __( 'Copy' ) }
		</Button>
	);
};
