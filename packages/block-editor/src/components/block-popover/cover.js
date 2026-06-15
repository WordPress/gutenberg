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
			...additionalStyles,
		};
	}, [ width, height, additionalStyles ] );

	return <div style={ style }>{ children }</div>;
}

export default forwardRef( BlockPopoverCover );
