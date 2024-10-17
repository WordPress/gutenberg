/**
 * WordPress dependencies
 */
import { useBlockProps, PlainText } from '@wordpress/block-editor';

let loading = false;

const requireMathJaxScript = () => {
	if ( loading ) {
		return;
	}

	loading = true;
	const script = document.createElement( 'script' );
	script.id = 'MathJax-script';
	script.setAttribute( 'async', '' );
	script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
	document.head.appendChild( script );
};

document.addEventListener( 'readystatechange', () => {
	if ( document.readyState === 'complete' ) {
		requireMathJaxScript();
	}
} );

/**
 * Generate an SVG data URI for embedding in an IMG element src.
 *
 * @param {Element} svg The input SVG
 * @return {string} Data URI for safely embedding SVG as a string.
 */
const svgElementToDataURI = ( svg ) => {
	return `data:image/svg+xml,${ encodeURIComponent(
		svg.childNodes[ 0 ].outerHTML
	) }`;
};

export const Edit = ( { attributes, isSelected, setAttributes } ) => {
	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>
			<figure>
				{ isSelected && (
					<>
						<PlainText
							value={ attributes.formulaSource }
							onChange={ ( value ) =>
								window.MathJax.tex2svgPromise( value ).then(
									( svg ) => {
										const errors =
											svg.childNodes[ 1 ].querySelectorAll(
												'merror'
											);

										if ( ! errors.length ) {
											setAttributes( {
												src: svgElementToDataURI( svg ),
												formulaSource: value,
												errors: null,
											} );
										} else {
											setAttributes( {
												formulaSource: value,
												errors: [ ...errors ].map(
													( error ) =>
														error.textContent
												),
											} );
										}
									}
								)
							}
							placeholder="a^2 = b^2 + c^2"
						/>
						<PlainText
							value={ attributes.alt }
							onChange={ ( alt ) => setAttributes( { alt } ) }
							placeholder="How would you describe your formula if your reader cannot read the symbols?"
						/>
					</>
				) }
				<img src={ attributes.src } alt={ attributes.alt } />
				{ attributes.errors?.length && (
					<ul>
						{ attributes.errors.map( ( error ) => (
							<li key={ error }>{ error }</li>
						) ) }
					</ul>
				) }
			</figure>
		</div>
	);
};

export default Edit;
