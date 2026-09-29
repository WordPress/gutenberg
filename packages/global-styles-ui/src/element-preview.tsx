import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';
import {
	__unstableIframe as Iframe,
	__unstableEditorStyles as EditorStyles,
	store as blockEditorStore,
	transformStyles,
	// @ts-expect-error: Not typed yet.
} from '@wordpress/block-editor';
import { __unstableGeneratePreviewStateStyles as generatePreviewStateStyles } from '@wordpress/global-styles-engine';
import type { GlobalStylesStyles } from '@wordpress/global-styles-engine';

interface ElementPreviewProps {
	element: string;
	/**
	 * The styles of the selected state, such as `:hover`, if any. The preview
	 * is inert and can't trigger the state, so it shows these styles on top of
	 * the sample's own.
	 */
	stateStyles?: GlobalStylesStyles;
}

/*
 * Centres the sample and strips the canvas chrome. Everything the sample
 * actually looks like comes from the site's own stylesheet.
 */
const PREVIEW_CSS = `
	body {
		margin: 0;
		padding: 16px;
		min-height: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		overflow: hidden;
	}
	figure.wp-block-image img.global-styles-ui-element-preview__media {
		display: block;
		width: 100%;
		height: 44px;
		max-height: 44px;
		border-radius: 2px;
		object-fit: cover;
		aspect-ratio: auto;
	}
	figure {
		margin: 0;
		max-width: 160px;
	}
	blockquote {
		margin: 0;
		max-width: 220px;
	}
	blockquote p {
		margin: 0 0 4px;
	}
`;

/**
 * Renders a sample of an element using the site's own styles.
 *
 * The sample is real markup carrying the classes the element's selector
 * targets, rendered in the editor's iframe with the generated stylesheet, so it
 * picks up every panel, the theme's fonts and the cascade, rather than a list of
 * properties copied across by hand.
 *
 * @param props
 * @param props.element     The element being previewed.
 * @param props.stateStyles The styles of the selected state, if any.
 */
export default function ElementPreview( {
	element,
	stateStyles,
}: ElementPreviewProps ) {
	const styles = useSelect(
		( select ) => select( blockEditorStore ).getSettings().styles,
		[]
	);

	// Show the selected state by rendering its styles as the element's own.
	// The link element's selector (0,0,1) is weaker than a theme's `:link` and
	// `:any-link` rules (0,1,0), which the sample always matches, so scope the
	// state's styles to the canvas body to outrank them.
	const stateCSS = useMemo( () => {
		if ( ! stateStyles ) {
			return '';
		}
		return transformStyles(
			[ { css: generatePreviewStateStyles( stateStyles, element ) } ],
			'.editor-styles-wrapper'
		).join( '' );
	}, [ stateStyles, element ] );

	const editorStyles = useMemo(
		() => [ ...( styles ?? [] ), { css: PREVIEW_CSS }, { css: stateCSS } ],
		[ styles, stateCSS ]
	);

	// Show a caption on the image the Image block uses for its own example,
	// rather than keeping a second copy of that URL here.
	const imageUrl = getBlockType( 'core/image' )?.example?.attributes?.url as
		string | undefined;

	let sample;
	switch ( element ) {
		case 'button':
			// The class is half of the element's selector, so a button only
			// picks up the element's styles when it carries it. It's a link, as
			// Button blocks are on the site, so the link-only states such as
			// `:any-link` apply to it the same way.
			sample = (
				<a className="wp-element-button" href="#anchor">
					{ __( 'Call to action' ) }
				</a>
			);
			break;
		case 'textInput':
			sample = (
				<input type="text" defaultValue={ __( 'Text' ) } readOnly />
			);
			break;
		case 'select':
			sample = (
				<select>
					<option>{ __( 'Select an option' ) }</option>
				</select>
			);
			break;
		case 'caption':
			sample = (
				<figure className="wp-block-image">
					{ imageUrl && (
						<img
							className="global-styles-ui-element-preview__media"
							src={ imageUrl }
							alt=""
						/>
					) }
					<figcaption className="wp-element-caption">
						{ __( 'A caption for the image above' ) }
					</figcaption>
				</figure>
			);
			break;
		case 'cite':
			sample = (
				<blockquote>
					<p>{ __( 'In quoting others, we cite ourselves.' ) }</p>
					<cite>{ __( 'Julio Cortázar' ) }</cite>
				</blockquote>
			);
			break;
		case 'link':
			sample = <a href="#anchor">{ __( 'A link' ) }</a>;
			break;
		case 'heading':
			// The shared heading entry has no tag of its own; any level shows
			// what it sets, and h2 is the most common in content.
			sample = <h2>{ __( 'Aa' ) }</h2>;
			break;
		default: {
			// The heading level elements are named after their tag.
			const Tag = ( /^h[1-6]$/.test( element ) ? element : 'p' ) as
				'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
			sample = <Tag>{ __( 'Aa' ) }</Tag>;
		}
	}

	return (
		<div className="global-styles-ui-element-preview">
			<Iframe
				tabIndex={ -1 }
				readonly
				title={ __( 'Element preview' ) }
				aria-hidden="true"
			>
				<EditorStyles styles={ editorStyles } />
				{ sample }
			</Iframe>
		</div>
	);
}
