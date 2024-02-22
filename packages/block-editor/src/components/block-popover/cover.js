/**
 * WordPress dependencies
 */
import { useEffect, useState, useMemo, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopover from '.';

function BlockPopoverCover(
	{ clientId, bottomClientId, children, shift = false, ...props },
	ref
) {
	bottomClientId ??= clientId;

	const selectedElement = useBlockElement( clientId );

	return (
		<BlockPopover
			ref={ ref }
			clientId={ clientId }
			bottomClientId={ bottomClientId }
			shift={ shift }
			{ ...props }
		>
			{ selectedElement && clientId === bottomClientId ? (
				<CoverContainer selectedElement={ selectedElement }>
					{ children }
				</CoverContainer>
			) : (
				children
			) }
		</BlockPopover>
	);
}

function CoverContainer( { selectedElement, children } ) {
	const [ width, setWidth ] = useState( selectedElement.offsetWidth );
	const [ height, setHeight ] = useState( selectedElement.offsetHeight );

	useEffect( () => {
		const observer = new window.ResizeObserver( () => {
			setWidth( selectedElement.offsetWidth );
			setHeight( selectedElement.offsetHeight );
		} );
		observer.observe( selectedElement, { box: 'border-box' } );
		return () => observer.disconnect();
	}, [ selectedElement ] );

	const style = useMemo( () => {
		return {
			position: 'absolute',
			width,
			height,
		};
	}, [ width, height ] );

	return <div style={ style }>{ children }</div>;
}

export default forwardRef( BlockPopoverCover );
