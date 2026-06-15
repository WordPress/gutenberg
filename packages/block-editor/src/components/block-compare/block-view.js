/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { RawHTML } from '@wordpress/element';
import { safeHTML } from '@wordpress/dom';

export default function BlockView( {
	title,
	rawContent,
	renderedContent,
	action,
	actionText,
	className,
} ) {
	return (
		<div className={ className }>
			<div className="block-editor-block-compare__content">
				<h2 className="block-editor-block-compare__heading">
					{ title }
				</h2>

				<div className="block-editor-block-compare__html">
					{ rawContent }
				</div>

				<div className="block-editor-block-compare__preview edit-post-visual-editor">
					<RawHTML>{ safeHTML( renderedContent ) }</RawHTML>
				</div>
			</div>

			<div className="block-editor-block-compare__action">
				<Button
					__next40pxDefaultSize
					variant="secondary"
					tabIndex="0"
					onClick={ action }
				>
					{ actionText }
				</Button>
			</div>
		</div>
	);
}
