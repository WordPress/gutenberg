/**
 * WordPress dependencies
 */
import { useEffect, useState, useMemo, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { PrivateBlockPopover } from '.';

function BlockPopoverCover(
	{
		clientId,
		bottomClientId,
		children,
		shift = false,
		additionalStyles,
		...props
	},
	ref
) {
	bottomClientId ??= clientId;

	const selectedElement = useBlockElement( clientId );

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
} ) {
	const [ width, setWidth ] = useState( () => {
		const rect = selectedElement.getBoundingClientRect();
		return rect.width;
	} );
	const [ height, setHeight ] = useState( () => {
		const rect = selectedElement.getBoundingClientRect();
		return rect.height;
	} );

	useEffect( () => {
		const observer = new window.ResizeObserver( () => {
			// Use getBoundingClientRect to get correct sizes when the
			// editor is zoomed in or out, accounting for any scaling.
			const rect = selectedElement.getBoundingClientRect();
			setWidth( rect.width );
			setHeight( rect.height );
		} );
		observer.observe( selectedElement, { box: 'border-box' } );
		return () => observer.disconnect();
	}, [ selectedElement ] );

	const style = useMemo( () => {
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
