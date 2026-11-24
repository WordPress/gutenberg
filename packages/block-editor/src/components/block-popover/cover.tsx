import type { CSSProperties, ForwardedRef, ReactNode } from 'react';
import { useEffect, useState, useMemo, forwardRef } from '@wordpress/element';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { PrivateBlockPopover } from '.';
import type { BlockPopoverCoverProps } from './types';

function BlockPopoverCover(
	{
		clientId,
		bottomClientId,
		children,
		shift = false,
		additionalStyles,
		...props
	}: BlockPopoverCoverProps,
	ref: ForwardedRef< HTMLDivElement >
) {
	bottomClientId ??= clientId;

	// Block wrappers are HTML elements.
	const selectedElement = useBlockElement( clientId ) as HTMLElement | null;

	return (
		<PrivateBlockPopover
			ref={ ref }
			clientId={ clientId }
			bottomClientId={ bottomClientId }
			shift={ shift }
			{ ...props }
		>
			{ selectedElement && clientId === bottomClientId ? (
				<CoverContainer
					selectedElement={ selectedElement }
					additionalStyles={ additionalStyles }
				>
					{ children }
				</CoverContainer>
			) : (
				children
			) }
		</PrivateBlockPopover>
	);
}

function CoverContainer( {
	selectedElement,
	additionalStyles = {},
	children,
}: {
	selectedElement: HTMLElement;
	additionalStyles?: CSSProperties;
	children?: ReactNode;
} ) {
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

	const style = useMemo< CSSProperties >( () => {
		return {
			position: 'absolute',
			width,
			height,
			...additionalStyles,
		};
	}, [ width, height, additionalStyles ] );

	return <div style={ style }>{ children }</div>;
}

export default forwardRef( BlockPopoverCover );
