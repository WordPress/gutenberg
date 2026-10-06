import clsx from 'clsx';
// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
import { BlockPreview } from '@wordpress/block-editor';
import { cloneBlock, type Block } from '@wordpress/blocks';
import { Button, Modal, PanelBody } from '@wordpress/components';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

type ImageComparisonProps = { before: Block; after: Block };

/**
 * A read-only comparison of the image versions in two revisions.
 *
 * @param {ImageComparisonProps} root0        Component props.
 * @param {Block}                root0.before The block from the older revision.
 * @param {Block}                root0.after  The block from the newer revision.
 */
function ImageComparison( { before, after }: ImageComparisonProps ) {
	const [ position, setPosition ] = useState( 50 );
	const [ unavailable, setUnavailable ] = useState< string[] >( [] );
	const previews = useMemo(
		() => ( {
			before: cloneBlock( before, { caption: '' } ),
			after: cloneBlock( after, { caption: '' } ),
		} ),
		[ before, after ]
	);

	useEffect( () => {
		// BlockPreview renders into its own document. Check availability here
		// so failed images can be described outside its inaccessible iframe.
		const images = Object.entries( previews ).map(
			( [ version, block ] ) => {
				const image = new window.Image();
				image.onerror = () =>
					setUnavailable( ( versions ) => [ ...versions, version ] );
				image.src = block.attributes.url as string;
				return image;
			}
		);
		return () => {
			images.forEach( ( image ) => {
				image.onerror = null;
			} );
		};
	}, [ previews ] );

	const hasUnavailableImage = unavailable.length > 0;
	return (
		<div className="editor-post-revisions-preview__image-comparison">
			{ ! hasUnavailableImage && (
				<p>{ __( 'Drag the slider to compare image versions.' ) }</p>
			) }
			<div className="editor-post-revisions-preview__image-controls">
				<Button
					variant="secondary"
					accessibleWhenDisabled
					size="compact"
					disabled={ hasUnavailableImage }
					onClick={ () => setPosition( 100 ) }
				>
					{ __( 'Show before' ) }
				</Button>
				<Button
					variant="secondary"
					accessibleWhenDisabled
					size="compact"
					disabled={ hasUnavailableImage }
					onClick={ () => setPosition( 0 ) }
				>
					{ __( 'Show after' ) }
				</Button>
			</div>
			<div
				className={ clsx(
					'editor-post-revisions-preview__image-stage',
					{ 'has-unavailable-image': hasUnavailableImage }
				) }
			>
				{ Object.entries( previews )
					.reverse()
					.map( ( [ version, block ] ) => (
						<div
							key={ version }
							role={
								unavailable.includes( version )
									? undefined
									: 'img'
							}
							aria-label={
								version === 'before'
									? sprintf(
											/* translators: %s: image alternative text. */
											__( 'Before image: %s' ),
											typeof block.attributes.alt ===
												'string'
												? block.attributes.alt
												: ''
										)
									: sprintf(
											/* translators: %s: image alternative text. */
											__( 'After image: %s' ),
											typeof block.attributes.alt ===
												'string'
												? block.attributes.alt
												: ''
										)
							}
							className={ clsx(
								'editor-post-revisions-preview__image-version',
								`is-${ version }`
							) }
							style={
								version === 'before' && ! hasUnavailableImage
									? {
											clipPath: `inset(0 ${ 100 - position }% 0 0)`,
										}
									: undefined
							}
						>
							<span className="editor-post-revisions-preview__image-label">
								{ version === 'before'
									? __( 'Before' )
									: __( 'After' ) }
							</span>
							{ unavailable.includes( version ) ? (
								<p role="status">
									{ version === 'before'
										? __(
												'The before image could not be loaded. Check that the image is still available.'
											)
										: __(
												'The after image could not be loaded. Check that the image is still available.'
											) }
								</p>
							) : (
								<BlockPreview
									blocks={ [ block ] }
									viewportWidth={ 0 }
								/>
							) }
						</div>
					) ) }
				{ ! hasUnavailableImage && (
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
							aria-valuetext={ sprintf(
								/* translators: 1: percentage of the before image, 2: percentage of the after image. */
								__( '%1$d%% before, %2$d%% after' ),
								position,
								100 - position
							) }
							onChange={ ( event ) =>
								setPosition( Number( event.target.value ) )
							}
						/>
					</>
				) }
			</div>
		</div>
	);
}

export default function ImageRevisionComparison( {
	before,
	after,
}: ImageComparisonProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	return (
		<PanelBody title={ __( 'Image changes' ) } initialOpen>
			<Button
				__next40pxDefaultSize
				variant="secondary"
				onClick={ () => setIsOpen( true ) }
			>
				{ __( 'Compare image' ) }
			</Button>
			{ isOpen && (
				<Modal
					title={ __( 'Compare image' ) }
					size="large"
					onRequestClose={ () => setIsOpen( false ) }
				>
					<ImageComparison before={ before } after={ after } />
				</Modal>
			) }
		</PanelBody>
	);
}
