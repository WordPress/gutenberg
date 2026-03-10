/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import halftoneWpLogo from './halftone-wp-logo';

/**
 * Scattered dots decoration that appears around the halftone WordPress logo.
 * Dot positions extracted from the Figma design SVG, converted from absolute
 * card coordinates (origin 424,-15) to decoration-relative coordinates.
 * Each dot is a 2.187x2.187 square matching the Figma export.
 */
const ScatteredDots = () => (
	<svg
		className="ai-plugin-callout__dots"
		viewBox="0 0 248 248"
		fill="black"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		focusable="false"
	>
		<rect x="184.055" y="54.995" width="2.187" height="2.187" />
		<rect x="170.059" y="44.06" width="2.187" height="2.187" />
		<rect x="200.238" y="77.302" width="2.187" height="2.187" />
		<rect x="212.048" y="87.8" width="2.187" height="2.187" />
		<rect x="206.799" y="83.425" width="2.187" height="2.187" />
		<rect x="204.175" y="85.612" width="2.187" height="2.187" />
		<rect x="219.046" y="103.108" width="2.187" height="2.187" />
		<rect x="154.751" y="30.064" width="2.187" height="2.187" />
		<rect x="188.866" y="63.742" width="2.187" height="2.187" />
		<rect x="148.189" y="34" width="2.187" height="2.187" />
		<rect x="134.051" y="31.707" width="2.187" height="2.187" />
		<rect x="126.124" y="24.771" width="2.187" height="2.187" />
		<rect x="115.385" y="29.19" width="2.187" height="2.187" />
		<rect x="95.702" y="31.376" width="2.187" height="2.187" />
		<rect x="91.766" y="27.002" width="2.187" height="2.187" />
		<rect x="90.454" y="32.688" width="2.187" height="2.187" />
		<rect x="184.389" y="45.58" width="2.187" height="2.187" />
		<rect x="162.185" y="41.873" width="2.187" height="2.187" />
	</svg>
);

export function AiPluginCallout() {
	return (
		<div className="ai-plugin-callout">
			<div className="ai-plugin-callout__content">
				<p>
					{ createInterpolateElement(
						__(
							'The <strong>AI plugin</strong> can use your connectors to generate featured images, alt text, titles, excerpts and more.'
						),
						{
							strong: <strong />,
						}
					) }
				</p>
				<div className="ai-plugin-callout__actions">
					<Button variant="primary" size="compact">
						{ __( 'Install AI experiments' ) }
					</Button>
					<Button variant="tertiary">{ __( 'Learn more' ) }</Button>
				</div>
			</div>
			<div className="ai-plugin-callout__decoration" aria-hidden="true">
				<img
					className="ai-plugin-callout__halftone"
					src={ halftoneWpLogo }
					alt=""
				/>
				<ScatteredDots />
			</div>
		</div>
	);
}
