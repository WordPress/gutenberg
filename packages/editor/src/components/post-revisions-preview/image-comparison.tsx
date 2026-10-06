import clsx from 'clsx';
// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
import { BlockPreview } from '@wordpress/block-editor';
import { cloneBlock, type Block } from '@wordpress/blocks';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

type ImageComparisonProps = { before: Block; after: Block };

/** A read-only comparison of the image versions in two revisions. */
export default function ImageComparison( {
	before,
	after,
}: ImageComparisonProps ) {
	const [ position, setPosition ] = useState( 50 );
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
							style={
								version === 'before'
									? {
											clipPath: `inset(0 ${ 100 - position }% 0 0)`,
										}
									: undefined
							}
						>
							<BlockPreview
								blocks={ [ block ] }
								viewportWidth={ 0 }
							/>
						</div>
					) ) }
				<>
					<span
						aria-hidden="true"
						className="editor-post-revisions-preview__image-divider"
						style={ { left: `${ position }%` } }
					/>
					{ /* A native range keeps keyboard and touch behavior on the reveal handle. */ }
					<input
						className="editor-post-revisions-preview__image-slider"
						type="range"
						min={ 0 }
						max={ 100 }
						value={ position }
						aria-label={ __( 'Image comparison' ) }
						onChange={ ( event ) =>
							setPosition( Number( event.target.value ) )
						}
					/>
				</>
			</div>
		</div>
	);
}
