import clsx from 'clsx';
// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
import { BlockPreview } from '@wordpress/block-editor';
import { cloneBlock, type Block } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

type ImageComparisonProps = { before: Block; after: Block };

/** A read-only comparison of the image versions in two revisions. */
export default function ImageComparison( {
	before,
	after,
}: ImageComparisonProps ) {
	const previews = useMemo(
		() => ( {
			before: cloneBlock( before, { caption: '' } ),
			after: cloneBlock( after, { caption: '' } ),
		} ),
		[ before, after ]
	);

	return (
		<div className="editor-post-revisions-preview__image-comparison">
			<p>{ __( 'Drag the slider to compare image versions.' ) }</p>
			<div className="editor-post-revisions-preview__image-stage">
				{ Object.entries( previews )
					.reverse()
					.map( ( [ version, block ] ) => (
						<div
							key={ version }
							className={ clsx(
								'editor-post-revisions-preview__image-version',
								`is-${ version }`
							) }
						>
							<BlockPreview
								blocks={ [ block ] }
								viewportWidth={ 0 }
							/>
						</div>
					) ) }
			</div>
		</div>
	);
}
