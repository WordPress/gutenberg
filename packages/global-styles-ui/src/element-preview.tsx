import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';
import {
	__unstableIframe as Iframe,
	__unstableEditorStyles as EditorStyles,
	store as blockEditorStore,
	// @ts-expect-error: Not typed yet.
} from '@wordpress/block-editor';

interface ElementPreviewProps {
	element: string;
	headingLevel: string;
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
 * @param props.element      The element being previewed.
 * @param props.headingLevel Which heading the Headings screen has selected.
 */
export default function ElementPreview( {
	element,
	headingLevel,
}: ElementPreviewProps ) {
	const styles = useSelect(
		( select ) => select( blockEditorStore ).getSettings().styles,
		[]
	);

	const editorStyles = useMemo(
		() => [ ...( styles ?? [] ), { css: PREVIEW_CSS } ],
		[ styles ]
	);

	// Show a caption on the image the Image block uses for its own example,
	// rather than keeping a second copy of that URL here.
	const imageUrl = getBlockType( 'core/image' )?.example?.attributes?.url as
		| string
		| undefined;

	let sample;
	switch ( element ) {
		case 'button':
			// The class is half of the element's selector, so a button only
			// picks up the element's styles when it carries it.
			sample = (
				<button className="wp-element-button" type="button">
					{ __( 'Call to action' ) }
				</button>
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
		case 'heading': {
			const Tag = (
				headingLevel === 'heading' ? 'h2' : headingLevel
			) as keyof JSX.IntrinsicElements;
			sample = <Tag>{ __( 'Aa' ) }</Tag>;
			break;
		}
		default:
			sample = <p>{ __( 'Aa' ) }</p>;
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
