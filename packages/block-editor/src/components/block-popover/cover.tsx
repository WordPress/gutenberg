import type { CSSProperties, ForwardedRef, ReactNode } from 'react';
import {
	privateApis as domPrivateApis,
	type DOMPrivateApis,
} from '@wordpress/dom';
import { useEffect, useState, useMemo, forwardRef } from '@wordpress/element';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { PrivateBlockPopover } from '.';
import { unlock } from '../../lock-unlock';
import type { BlockPopoverCoverProps } from './types';

const { getViewportVectorTransform } =
	unlock< DOMPrivateApis >( domPrivateApis );

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
	const [ matrix, setMatrix ] = useState( () =>
		getViewportVectorTransform( selectedElement )
	);

	useEffect( () => {
		const update = () => {
			setWidth( selectedElement.offsetWidth );
			setHeight( selectedElement.offsetHeight );
			setMatrix( getViewportVectorTransform( selectedElement ) );
		};
		const resizeObserver = new window.ResizeObserver( update );
		resizeObserver.observe( selectedElement, { box: 'border-box' } );
		// A rotation or scale changes the block's style, not its size.
		const mutationObserver = new window.MutationObserver( update );
		mutationObserver.observe( selectedElement, {
			attributes: true,
			attributeFilter: [ 'style', 'class' ],
		} );
		return () => {
			resizeObserver.disconnect();
			mutationObserver.disconnect();
		};
	}, [ selectedElement ] );

	const style = useMemo< CSSProperties >( () => {
		const { a, b, c, d } = matrix;
		if ( a === 1 && b === 0 && c === 0 && d === 1 ) {
			return {
				position: 'absolute',
				width,
				height,
				...additionalStyles,
			};
		}
		// The popover sits at the corner of the block's on-screen bounding
		// box. Centre the cover in that box and turn it to match the block.
		const boundsWidth = Math.abs( a ) * width + Math.abs( c ) * height;
		const boundsHeight = Math.abs( b ) * width + Math.abs( d ) * height;
		return {
			position: 'absolute',
			width,
			height,
			left: ( boundsWidth - width ) / 2,
			top: ( boundsHeight - height ) / 2,
			transform: `matrix(${ a }, ${ b }, ${ c }, ${ d }, 0, 0)`,
			transformOrigin: 'center',
			...additionalStyles,
		};
	}, [ width, height, matrix, additionalStyles ] );

	return <div style={ style }>{ children }</div>;
}

export default forwardRef( BlockPopoverCover );
