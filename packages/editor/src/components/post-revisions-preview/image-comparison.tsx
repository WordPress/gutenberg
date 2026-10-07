import clsx from 'clsx';
// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
import { BlockPreview } from '@wordpress/block-editor';
import { cloneBlock, type Block } from '@wordpress/blocks';
import { Button, Modal, PanelBody } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';

type ImageComparisonProps = { before: Block; after: Block };
type Version = 'before' | 'after';
type Mode = Version | 'compare';
type ImageSize = { width: number; height: number };
type ImageAvailability = Partial< Record< Version, ImageSize | null > >;
const MODES: Mode[] = [ 'before', 'compare', 'after' ];
const VERSIONS: Version[] = [ 'before', 'after' ];
// Remove page decoration while preserving the Image block's own theme styles.
const IMAGE_PREVIEW_STYLES = [
	{ css: 'html, body { background: transparent; padding: 0; }' },
];

/** Keep historical attributes independent of current binding sources. */
function cloneImagePreview( block: Block ) {
	const originalMetadata = block.attributes.metadata;
	const metadata: Record< string, unknown > =
		originalMetadata &&
		typeof originalMetadata === 'object' &&
		! Array.isArray( originalMetadata )
			? { ...originalMetadata }
			: {};
	// Includes the default pattern-override binding, which can bind caption.
	delete metadata.bindings;
	return cloneBlock( block, { caption: '', metadata } );
}

/** Measure layout before transforming, so fitting cannot change the extent. */
function FittedImagePreview( {
	block,
	frameHeight,
	onHeightChange,
}: {
	block: Block;
	frameHeight: number;
	onHeightChange: ( height: number ) => void;
} ) {
	const [ height, setHeight ] = useState( 0 );
	const previewRef = useResizeObserver< HTMLDivElement >( ( [ entry ] ) => {
		const nextHeight = entry.contentRect.height;
		setHeight( nextHeight );
		onHeightChange( nextHeight );
	} );
	const scale = height > 0 ? Math.min( 1, frameHeight / height ) : 0;
	return (
		<div
			ref={ previewRef }
			className="editor-post-revisions-preview__image-preview"
			style={ {
				transform: `translate(-50%, -50%) scale(${ scale })`,
				visibility: scale > 0 ? undefined : 'hidden',
			} }
		>
			{ /* Match the preview viewport to its container; fit the whole block above. */ }
			<BlockPreview
				blocks={ [ block ] }
				viewportWidth={ 0 }
				additionalStyles={ IMAGE_PREVIEW_STYLES }
			/>
		</div>
	);
}

/**
 * A read-only comparison of the image versions in two revisions.
 *
 * @param {ImageComparisonProps} root0        Component props.
 * @param {Block}                root0.before The block from the older revision.
 * @param {Block}                root0.after  The block from the newer revision.
 */
function ImageComparison( { before, after }: ImageComparisonProps ) {
	const [ mode, setMode ] = useState< Mode >( 'compare' );
	const [ position, setPosition ] = useState( 50 );
	const [ availability, setAvailability ] = useState< ImageAvailability >(
		{}
	);
	const [ previewHeights, setPreviewHeights ] = useState<
		Partial< Record< Version, number > >
	>( {} );
	const [ frameHeight, setFrameHeight ] = useState( 0 );
	const stageRef = useResizeObserver< HTMLDivElement >( ( [ entry ] ) => {
		setFrameHeight( entry.contentRect.height );
	} );
	const previews = useMemo(
		() => ( {
			before: cloneImagePreview( before ),
			after: cloneImagePreview( after ),
		} ),
		[ before, after ]
	);

	useEffect( () => {
		setAvailability( {} );
		setPreviewHeights( {} );
		// The probe and disposable preview use the same saved URL. Current
		// bindings cannot replace it inside BlockPreview's separate document.
		const images = VERSIONS.map( ( version ) => {
			const url = previews[ version ].attributes.url;
			if ( typeof url !== 'string' || ! url.trim() ) {
				setAvailability( ( current ) => ( {
					...current,
					[ version ]: null,
				} ) );
				return null;
			}
			const image = new window.Image();
			image.onload = () => {
				setAvailability( ( current ) => ( {
					...current,
					[ version ]:
						image.naturalWidth > 0 && image.naturalHeight > 0
							? {
									width: image.naturalWidth,
									height: image.naturalHeight,
								}
							: null,
				} ) );
			};
			image.onerror = () =>
				setAvailability( ( current ) => ( {
					...current,
					[ version ]: null,
				} ) );
			image.src = url;
			return image;
		} );
		return () => {
			images.forEach( ( image ) => {
				if ( image ) {
					image.onload = null;
					image.onerror = null;
				}
			} );
		};
	}, [ previews ] );

	const isUnavailable = ( version: Version ) => {
		const url = previews[ version ].attributes.url;
		return (
			availability[ version ] === null ||
			typeof url !== 'string' ||
			! url.trim()
		);
	};
	const hasUnavailableImage = VERSIONS.some( isUnavailable );
	const hasPreview = VERSIONS.some(
		( version ) => ! isUnavailable( version )
	);
	const isComparing = mode === 'compare' && ! hasUnavailableImage;
	const labels = {
		before: __( 'Before' ),
		compare: __( 'Compare' ),
		after: __( 'After' ),
	};
	const previewHeight = Math.max(
		...VERSIONS.map( ( version ) =>
			isUnavailable( version ) ? 0 : ( previewHeights[ version ] ?? 0 )
		)
	);
	const content = (
		<>
			<div className="editor-post-revisions-preview__image-labels">
				{ VERSIONS.map( ( version ) => {
					const size = availability[ version ];
					return (
						<div key={ version }>
							<span>{ labels[ version ] }</span>
							{ size && (
								<span className="editor-post-revisions-preview__image-dimensions">
									{ sprintf(
										/* translators: 1: source image width in pixels, 2: source image height in pixels. */
										__( 'Source: %1$d × %2$d px' ),
										size.width,
										size.height
									) }
								</span>
							) }
						</div>
					);
				} ) }
			</div>
			{ VERSIONS.map(
				( version ) =>
					isUnavailable( version ) && (
						<p key={ version } role="status">
							{ version === 'before'
								? __(
										'The before image could not be loaded. Check that the image is still available.'
									)
								: __(
										'The after image could not be loaded. Check that the image is still available.'
									) }
						</p>
					)
			) }
			<div
				ref={ stageRef }
				className="editor-post-revisions-preview__image-stage"
				style={ {
					height: previewHeight || ( hasPreview ? undefined : 44 ),
				} }
			>
				{ [ ...VERSIONS ].reverse().map( ( version ) => {
					const block = previews[ version ];
					if ( isUnavailable( version ) ) {
						return null;
					}
					return (
						<div
							key={ version }
							role="img"
							aria-hidden={
								! hasUnavailableImage &&
								mode !== 'compare' &&
								mode !== version
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
							style={ {
								visibility:
									! hasUnavailableImage &&
									mode !== 'compare' &&
									mode !== version
										? 'hidden'
										: undefined,
								clipPath:
									version === 'before' && isComparing
										? `inset(0 ${ 100 - position }% 0 0)`
										: undefined,
							} }
						>
							<FittedImagePreview
								block={ block }
								frameHeight={ frameHeight }
								onHeightChange={ ( height ) =>
									setPreviewHeights( ( current ) =>
										current[ version ] === height
											? current
											: {
													...current,
													[ version ]: height,
												}
									)
								}
							/>
						</div>
					);
				} ) }
				{ /* Keep the native range mounted if media fails while it has focus. */ }
				{ mode === 'compare' && (
					<input
						className="editor-post-revisions-preview__image-slider"
						type="range"
						min={ 0 }
						max={ 100 }
						value={ position }
						aria-disabled={ hasUnavailableImage }
						aria-label={ __( 'Image comparison' ) }
						aria-valuetext={ sprintf(
							/* translators: 1: percentage of the before image, 2: percentage of the after image. */
							__( '%1$d%% before, %2$d%% after' ),
							position,
							100 - position
						) }
						style={ {
							pointerEvents: hasUnavailableImage
								? 'none'
								: undefined,
						} }
						onChange={ ( event ) => {
							if ( ! hasUnavailableImage ) {
								setPosition( Number( event.target.value ) );
							}
						} }
					/>
				) }
				{ isComparing && (
					<>
						<span
							aria-hidden="true"
							className="editor-post-revisions-preview__image-divider"
							style={ { left: `${ position }%` } }
						/>
						<span
							aria-hidden="true"
							className="editor-post-revisions-preview__image-handle"
							style={ { left: `${ position }%` } }
						/>
					</>
				) }
			</div>
			{ hasPreview && (
				<p className="editor-post-revisions-preview__image-help">
					{ isComparing
						? __(
								'Drag the slider to compare. Previews are scaled to fit.'
							)
						: __( 'Previews are scaled to fit.' ) }
				</p>
			) }
		</>
	);

	return (
		<Tabs.Root
			className="editor-post-revisions-preview__image-comparison"
			value={ mode }
			onValueChange={ ( value ) => {
				if (
					! MODES.includes( value as Mode ) ||
					hasUnavailableImage
				) {
					return;
				}
				setMode( value as Mode );
				if ( value === 'compare' ) {
					setPosition( 50 );
				}
			} }
		>
			<Tabs.List
				className="editor-post-revisions-preview__image-controls"
				aria-label={ __( 'Image comparison view' ) }
			>
				{ MODES.map( ( value ) => (
					<Tabs.Tab
						key={ value }
						value={ value }
						disabled={ hasUnavailableImage }
					>
						{ labels[ value ] }
					</Tabs.Tab>
				) ) }
			</Tabs.List>
			{ MODES.map( ( value ) => (
				<Tabs.Panel key={ value } value={ value }>
					{ mode === value && content }
				</Tabs.Panel>
			) ) }
		</Tabs.Root>
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
