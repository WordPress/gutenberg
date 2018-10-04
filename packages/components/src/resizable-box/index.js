/**
 * External dependencies
 */
import classnames from 'classnames';
import ReResizableBox from 're-resizable';

function ResizableBox( { className, ...props } ) {
	// Removes the inline styles in the drag handles.
	const handleStylesOverrides = {
		width: null,
		height: null,
		top: null,
		right: null,
		bottom: null,
		left: null,
	};

	return (
		<ReResizableBox
			className={ classnames(
				'components-resizable-box__container',
				className,
			) }
			handleClasses={ {
				top: 'components-resizable-box__handle-top',
				right: 'components-resizable-box__handle-right',
				bottom: 'components-resizable-box__handle-bottom',
				left: 'components-resizable-box__handle-left',
			} }
			handleStyles={ {
				top: handleStylesOverrides,
				right: handleStylesOverrides,
				bottom: handleStylesOverrides,
				left: handleStylesOverrides,
			} }
			{ ...props }
		/>
	);
}

export default ResizableBox;
