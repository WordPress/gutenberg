/**
 * WordPress dependencies
 */
import { useCopyToClipboard } from '@wordpress/compose';
import { useState, useEffect, useRef } from '@wordpress/element';
import { copy } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CopyButton } from './styles';
import { Text } from '../text';
import { Tooltip } from '../ui/tooltip';

import type { ColorCopyButtonProps } from './types';

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
		<Tooltip
			content={
				<Text color="white">
					{ copiedColor === color.toHex()
						? __( 'Copied!' )
						: __( 'Copy' ) }
				</Text>
			}
			placement="bottom"
		>
			<CopyButton
				isSmall
				ref={ copyRef }
				icon={ copy }
				showTooltip={ false }
			/>
		</Tooltip>
	);
};
