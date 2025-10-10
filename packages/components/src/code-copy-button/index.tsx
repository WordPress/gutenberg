/**
 * WordPress dependencies
 */
import { useCopyToClipboard } from '@wordpress/compose';
import { useState, useEffect, useRef } from '@wordpress/element';
import { copy, check, textWrap } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from '../button';
import Tooltip from '../tooltip';

interface CodeCopyButtonProps {
	text: string;
	onWordWrapToggle?: ( isWrapped: boolean ) => void;
	isWordWrapped?: boolean;
}

export const CodeCopyButton = ( {
	text,
	onWordWrapToggle,
	isWordWrapped = false,
}: CodeCopyButtonProps ) => {
	const [ isCopied, setIsCopied ] = useState( false );
	const copyTimerRef = useRef< ReturnType< typeof setTimeout > >();

	const copyRef = useCopyToClipboard(
		text,
		() => {
			if ( copyTimerRef.current ) {
				clearTimeout( copyTimerRef.current );
			}
			setIsCopied( true );
			copyTimerRef.current = setTimeout( () => {
				setIsCopied( false );
				copyTimerRef.current = undefined;
			}, 3000 );
		}
	);

	useEffect( () => {
		return () => {
			if ( copyTimerRef.current ) {
				clearTimeout( copyTimerRef.current );
			}
		};
	}, [] );

	const handleWordWrapToggle = () => {
		if ( onWordWrapToggle ) {
			onWordWrapToggle( ! isWordWrapped );
		}
	};

	const copyLabel = isCopied ? __( 'Copied!' ) : __( 'Copy' );
	const wrapLabel = isWordWrapped ? __( 'Unwrap text' ) : __( 'Wrap text' );

	return (
		<div style={ { display: 'flex', gap: '4px' } }>
			{ onWordWrapToggle && (
				<Tooltip delay={ 0 } hideOnClick={ false } text={ wrapLabel }>
					<Button
						size="compact"
						aria-label={ wrapLabel }
						onClick={ handleWordWrapToggle }
						icon={ textWrap }
						showTooltip={ false }
						variant={ isWordWrapped ? 'primary' : 'secondary' }
					/>
				</Tooltip>
			) }
			<Tooltip delay={ 0 } hideOnClick={ false } text={ copyLabel }>
				<Button
					size="compact"
					aria-label={ copyLabel }
					ref={ copyRef }
					icon={ isCopied ? check : copy }
					showTooltip={ false }
				/>
			</Tooltip>
		</div>
	);
};