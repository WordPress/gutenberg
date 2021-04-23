/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useRef } from '@wordpress/element';
/**
 * External dependencies
 */
import classnames from 'classnames';

const baseClassName = 'wp-block-template-part__content-lock';

export default function ContentLock( { clientId, children } ) {
	const wrapperRef = useRef();

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

	const classes = classnames( baseClassName, {
		'overlay-selected': isSelected,
		'child-selected': hasChildSelected,
	} );
	const onClick = ! ( isSelected || hasChildSelected )
		? () => selectBlock( clientId )
		: null;

	return (
		<div className={ classes }>
			<ContentOverlay
				onClick={ onClick }
				height={ wrapperRef.current?.clientHeight }
				width={ wrapperRef.current?.clientWidth }
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

function ContentOverlay( { onClick, height, width } ) {
	const overlayDimensions =
		height && width
			? {
					height: height + 'px',
					width: width + 'px',
			  }
			: {};
	return (
		<button
			className={ `${ baseClassName }-overlay` }
			style={ overlayDimensions }
			onClick={ onClick }
		/>
	);
}
