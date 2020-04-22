/**
 * External dependencies
 */
import classnames from 'classnames';
import { Resizable } from 're-resizable';

function ResizableBox( { className, showHandle = false, ...props } ) {
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
	const sideHandleClassName = 'components-resizable-box__side-handle';
	const cornerHandleClassName = 'components-resizable-box__corner-handle';

	return (
		<Resizable
			className={ classnames(
				'components-resizable-box__container',
				showHandle && 'has-show-handle',
				className
			) }
			handleClasses={ {
				top: classnames(
					handleClassName,
					sideHandleClassName,
					'components-resizable-box__handle-top'
				),
				right: classnames(
					handleClassName,
					sideHandleClassName,
					'components-resizable-box__handle-right'
				),
				bottom: classnames(
					handleClassName,
					sideHandleClassName,
					'components-resizable-box__handle-bottom'
				),
				left: classnames(
					handleClassName,
					sideHandleClassName,
					'components-resizable-box__handle-left'
				),
				topLeft: classnames(
					handleClassName,
					cornerHandleClassName,
					'components-resizable-box__handle-top',
					'components-resizable-box__handle-left'
				),
				topRight: classnames(
					handleClassName,
					cornerHandleClassName,
					'components-resizable-box__handle-top',
					'components-resizable-box__handle-right'
				),
				bottomRight: classnames(
					handleClassName,
					cornerHandleClassName,
					'components-resizable-box__handle-bottom',
					'components-resizable-box__handle-right'
				),
				bottomLeft: classnames(
					handleClassName,
					cornerHandleClassName,
					'components-resizable-box__handle-bottom',
					'components-resizable-box__handle-left'
				),
			} }
			handleStyles={ {
				top: handleStylesOverrides,
				right: handleStylesOverrides,
				bottom: handleStylesOverrides,
				left: handleStylesOverrides,
				topLeft: handleStylesOverrides,
				topRight: handleStylesOverrides,
				bottomRight: handleStylesOverrides,
				bottomLeft: handleStylesOverrides,
			} }
			{ ...props }
		/>
	);
}

export default ResizableBox;
