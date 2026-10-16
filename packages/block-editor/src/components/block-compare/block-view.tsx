import { Button } from '@wordpress/components';
import { RawHTML } from '@wordpress/element';
import { safeHTML } from '@wordpress/dom';
import type { BlockViewProps } from './types';

export default function BlockView( {
	title,
	rawContent,
	renderedContent,
	action,
	actionText,
	className,
}: BlockViewProps ) {
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
					// React renders the string attribute as is.
					tabIndex={ '0' as unknown as number }
					onClick={ action }
				>
					{ actionText }
				</Button>
			</div>
		</div>
	);
}
