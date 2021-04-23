/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useRef, useEffect, useState } from '@wordpress/element';
/**
 * External dependencies
 */
import classnames from 'classnames';

export default function ContentLock( { clientId, children } ) {
	const wrapperRef = useRef();
	const baseClassName = 'wp-block-template-part__content-lock';

	const [ overlaySizes, setOverlaySizes ] = useState( {} );
	const { isSelected, hasChildSelected } = useSelect(
		( select ) => {
			const { isBlockSelected, hasSelectedInnerBlock } = select(
				blockEditorStore
			);
			return {
				isSelected: isBlockSelected( clientId ),
				hasChildSelected: hasSelectedInnerBlock( clientId, true ),
			};
		},
		[ clientId ]
	);

	const selectBlock = useDispatch( blockEditorStore ).selectBlock;

	useEffect( () => {
		if ( wrapperRef.current?.clientHeight && ! hasChildSelected ) {
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
		hasChildSelected,
	] );

	const classes = classnames( baseClassName, {
		'overlay-selected': isSelected,
		'child-selected': hasChildSelected,
	} );
	const onClick = ! ( isSelected || hasChildSelected )
		? () => selectBlock( clientId )
		: null;

	return (
		<div className={ classes }>
			<button
				className={ `${ baseClassName }-overlay` }
				style={ overlaySizes }
				onClick={ onClick }
			/>
			<div
				className={ `${ baseClassName }-content-wrapper` }
				ref={ wrapperRef }
			>
				{ children }
			</div>
		</div>
	);
}
