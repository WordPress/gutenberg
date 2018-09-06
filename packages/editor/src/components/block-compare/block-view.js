/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

const BlockView = ( { title, rawContent, renderedContent, action, actionText, className } ) => {
	return (
		<div className={ className }>
			<div className="editor-block-compare__content">
				<h1 className="components-modal__header-heading">{ title }</h1>

				<div className="editor-block-compare__html">
					{ rawContent }
				</div>

				<div className="editor-block-compare__preview edit-post-visual-editor">
					{ renderedContent }
				</div>
			</div>

			<div className="editor-block-compare__action">
				<Button isLarge tabindex="0" onClick={ action }>{ actionText }</Button>
			</div>
		</div>
	);
};

export default BlockView;
