/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useRef, useEffect, useState } from '@wordpress/element';

export default function ContentLock( { clientId, children } ) {
	const wrapperRef = useRef();

	const [ overlaySizes, setOverlaySizes ] = useState( {} );
	const { isSelected, hasChildSelected } = useSelect(
		( select ) => {
			const { isBlockSelected, hasSelectedInnerBlock } = select(
				blockEditorStore
			);
			return {
				isSelected: isBlockSelected( clientId ),
				hasChildSelected: hasSelectedInnerBlock( clientId ),
			};
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( wrapperRef.current?.clientHeight ) {
			setOverlaySizes( {
				height: wrapperRef.current?.clientHeight + 'px',
				width: wrapperRef.current?.clientWidth + 'px',
			} );
		} else {
			setOverlaySizes( {} );
		}
	}, [
		wrapperRef.current,
		wrapperRef.current?.clientHeight,
		wrapperRef.current?.clientWidth,
	] );

	// if not selected in any way, disable children / wrap container (no color)
	if ( true || ! ( isSelected || hasChildSelected ) ) {
		return (
			<div className="wp-block-template-part__content-lock">
				<div
					className="wp-block-template-part__content-lock-overlay"
					style={ overlaySizes }
				/>

				<div
					className="wp-block-template-part__content-lock-content-wrapper"
					ref={ wrapperRef }
				>
					{ children }
				</div>
			</div>
		);
	}
	// if isSelected -  wrap container (color) + disable children? | unlock button?
	// if childSelected - normal ?

	return <div>{ children }</div>;
}
