/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import {
	InnerBlocks,
	useBlockProps,
	InspectorControls,
	useInnerBlocksProps,
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { View } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import GroupPlaceHolder, { useShouldShowPlaceHolder } from './placeholder';
import { unlock } from '../lock-unlock';

const { HTMLElementControl } = unlock( blockEditorPrivateApis );

/**
 * Render inspector controls for the Group block.
 *
 * @param {Object}   props                 Component props.
 * @param {string}   props.tagName         The HTML tag name.
 * @param {Function} props.onSelectTagName onChange function for the SelectControl.
 * @param {string}   props.clientId        The client ID of the current block.
 *
 * @return {React.JSX.Element}                The control group.
 */
function GroupEditControls( { tagName, onSelectTagName, clientId } ) {
	return (
		<InspectorControls group="advanced">
			<HTMLElementControl
				tagName={ tagName }
				onChange={ onSelectTagName }
				clientId={ clientId }
				options={ [
					{ label: __( 'Default (<div>)' ), value: 'div' },
					{ label: '<header>', value: 'header' },
					{ label: '<main>', value: 'main' },
					{ label: '<section>', value: 'section' },
					{ label: '<article>', value: 'article' },
					{ label: '<aside>', value: 'aside' },
					{ label: '<footer>', value: 'footer' },
				] }
			/>
		</InspectorControls>
	);
}

function GroupEdit( { attributes, name, setAttributes, clientId } ) {
	const { hasInnerBlocks, themeSupportsLayout } = useSelect(
		( select ) => {
			const { getBlock, getSettings } = select( blockEditorStore );
			const block = getBlock( clientId );
			return {
				hasInnerBlocks: !! ( block && block.innerBlocks.length ),
				themeSupportsLayout: getSettings()?.supportsLayout,
			};
		},
		[ clientId ]
	);

	const {
		tagName: TagName = 'div',
		templateLock,
		allowedBlocks,
		layout = {},
	} = attributes;

	// Layout settings.
	const { type = 'default' } = layout;
	const layoutSupportEnabled =
		themeSupportsLayout || type === 'flex' || type === 'grid';

	// Hooks.
	const ref = useRef();
	const blockProps = useBlockProps( { ref } );

	// Background image — read attributes used for editor <img> rendering.
	const bgData = attributes.style?.background ?? {};
	const bgImageId = bgData.backgroundImage?.id;
	const bgSize = bgData.backgroundSize ?? 'cover';
	const bgRepeat = bgData.backgroundRepeat;
	const bgPosition = bgData.backgroundPosition;
	const bgUrl = bgData.backgroundImage?.url;
	const bgGradient = bgData.gradient;

	// Render the background as <img> in the editor for all cover/contain images without
	// tiling. This includes background-attachment:fixed: the editor canvas runs inside an
	// iframe where fixed-attachment CSS positions the background relative to the iframe
	// viewport (often rendering it off-screen), so <img> is a better editor preview.
	// The PHP renderer handles background-attachment:fixed correctly on the frontend via
	// CSS (see lib/block-supports/background.php $use_img_element logic).
	// When a gradient is also set, it is rendered as a separate overlay <div> (see
	// bgGradientOverlayElement below) so the image still benefits from srcset.
	const useImgElement =
		!! bgImageId &&
		[ 'cover', 'contain' ].includes( bgSize ) &&
		( ! bgRepeat || bgRepeat === 'no-repeat' );

	// Resolve 'var:preset|gradient|slug' to a CSS variable the browser can evaluate.
	// Raw CSS gradient values (e.g. 'linear-gradient(...)') pass through unchanged.
	const resolvedGradient = bgGradient
		? bgGradient.replace(
				/^var:preset\|gradient\|(.+)$/,
				'var(--wp--preset--gradient--$1)'
		  )
		: null;

	// When using <img>, strip background-* CSS from wrapper and add position:relative.
	const resolvedBlockProps = useImgElement
		? {
				...blockProps,
				style: {
					...Object.fromEntries(
						Object.entries( blockProps.style ?? {} ).filter(
							( [ k ] ) => ! k.startsWith( 'background' )
						)
					),
					position: 'relative',
				},
		  }
		: blockProps;

	const [ showPlaceholder, setShowPlaceholder ] = useShouldShowPlaceHolder( {
		attributes,
		usedLayoutType: type,
		hasInnerBlocks,
	} );

	// Default to the regular appender being rendered.
	let renderAppender;
	if ( showPlaceholder ) {
		// In the placeholder state, ensure the appender is not rendered.
		// This is needed because `...innerBlocksProps` is used in the placeholder
		// state so that blocks can dragged onto the placeholder area
		// from both the list view and in the editor canvas.
		renderAppender = false;
	} else if ( ! hasInnerBlocks ) {
		// When there is no placeholder, but the block is also empty,
		// use the larger button appender.
		renderAppender = InnerBlocks.ButtonBlockAppender;
	}

	const innerBlocksProps = useInnerBlocksProps(
		// When rendering a background <img>, mirror the Cover block pattern:
		// use a plain inner container so the outer wrapper can safely hold
		// position:relative without displacing the block editor's appenders.
		layoutSupportEnabled && ! useImgElement
			? resolvedBlockProps
			: { className: 'wp-block-group__inner-container' },
		{
			dropZoneElement: ref.current,
			templateLock,
			allowedBlocks,
			renderAppender,
		}
	);

	const { selectBlock } = useDispatch( blockEditorStore );

	const selectVariation = ( nextVariation ) => {
		setAttributes( nextVariation.attributes );
		selectBlock( clientId, -1 );
		setShowPlaceholder( false );
	};

	// Background <img> — mirrors PHP $use_img_element. Rendered as JSX following
	// the Cover block pattern: sibling of the inner blocks container so that
	// position:relative on the outer wrapper never displaces editor appenders.
	const bgImgElement = useImgElement && bgUrl && (
		<img
			className="wp-block__background-image"
			alt=""
			aria-hidden="true"
			src={ bgUrl }
			style={ {
				position: 'absolute',
				top: '0',
				left: '0',
				right: '0',
				bottom: '0',
				margin: '0',
				padding: '0',
				width: '100%',
				height: '100%',
				maxWidth: 'none',
				maxHeight: 'none',
				pointerEvents: 'none',
				objectFit: bgSize,
				...( bgPosition ? { objectPosition: bgPosition } : {} ),
			} }
			data-object-fit={ bgSize }
		/>
	);

	// Gradient overlay — rendered as a sibling <div> when both image and gradient
	// are set. The CSS rule `.wp-block-group > .wp-block__background-image ~ *`
	// gives this element z-index:1 (above the img) while inner content, which comes
	// later in DOM order, also gets z-index:1 and therefore paints above the gradient.
	const bgGradientOverlayElement = useImgElement && resolvedGradient && (
		<div
			aria-hidden="true"
			className="wp-block__background-gradient"
			style={ {
				position: 'absolute',
				top: '0',
				left: '0',
				right: '0',
				bottom: '0',
				zIndex: 1,
				margin: '0',
				maxWidth: 'none',
				backgroundImage: resolvedGradient,
				backgroundSize: 'cover',
				pointerEvents: 'none',
			} }
		/>
	);

	return (
		<>
			<GroupEditControls
				tagName={ TagName }
				onSelectTagName={ ( value ) =>
					setAttributes( { tagName: value } )
				}
				clientId={ clientId }
			/>
			{ showPlaceholder && (
				<View>
					{ innerBlocksProps.children }
					<GroupPlaceHolder
						name={ name }
						onSelect={ selectVariation }
					/>
				</View>
			) }
			{ /* Layout-supported path (no background img): wrapper = inner blocks container */ }
			{ layoutSupportEnabled && ! useImgElement && ! showPlaceholder && (
				<TagName { ...innerBlocksProps } />
			) }
			{ /* Cover-block pattern: separate outer wrapper + inner container.
				 Used whenever a background <img> is active (any layout) or for the
				 classic non-layout path, matching the original backward-compat div. */ }
			{ ( useImgElement || ! layoutSupportEnabled ) &&
				! showPlaceholder && (
					<TagName { ...resolvedBlockProps }>
						{ bgImgElement }
						{ bgGradientOverlayElement }
						<div { ...innerBlocksProps } />
					</TagName>
				) }
		</>
	);
}

export default GroupEdit;
