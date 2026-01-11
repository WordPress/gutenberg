/**
 * WordPress dependencies
 */
import { useBlockProps, RichText } from '@wordpress/block-editor';

const saveBlockProps = useBlockProps.save;

export default function NavigationOverlayCloseSave( { attributes } ) {
	const { displayMode, text } = attributes;
	const showIcon = displayMode === 'icon' || displayMode === 'both';
	const showText = displayMode === 'text' || displayMode === 'both';

	const blockProps = saveBlockProps( {
		className: 'wp-block-navigation-overlay-close',
	} );

	return (
		<button
			{ ...blockProps }
			type="button"
			aria-label={ ! showText ? 'Close' : undefined }
		>
			{ showIcon && (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					width="24"
					height="24"
					aria-hidden="true"
					focusable="false"
				>
					<path d="M13 11.8l6.1-6.3-1.1-1-6.1 6.2-6.1-6.2-1.1 1 6.1 6.3-6.5 6.7 1.1 1 6.5-6.6 6.5 6.6 1.1-1z" />
				</svg>
			) }
			{ showText && (
				<RichText.Content
					tagName="span"
					value={ text }
					className="wp-block-navigation-overlay-close__text"
				/>
			) }
		</button>
	);
}
