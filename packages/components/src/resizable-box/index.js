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

	const handleClassName = 'components-resizable-box__handle';

	return (
		<ReResizableBox
			className={ classnames(
				'components-resizable-box__container',
				className,
			) }
			handleClasses={ {
				top: classnames(
					handleClassName,
					'components-resizable-box__handle-top',
				),
				right: classnames(
					handleClassName,
					'components-resizable-box__handle-right',
				),
				bottom: classnames(
					handleClassName,
					'components-resizable-box__handle-bottom',
				),
				left: classnames(
					handleClassName,
					'components-resizable-box__handle-left',
				),
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
