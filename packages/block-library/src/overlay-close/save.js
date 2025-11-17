/**
 * WordPress dependencies
 */
export default function OverlayCloseSave() {
	return (
		<div className="wp-block-overlay-close">
			<button
				type="button"
				className="wp-block-overlay-close__button"
				aria-label="Close overlay"
			>
				<span className="wp-block-overlay-close__icon">×</span>
				<span className="wp-block-overlay-close__text">Close</span>
			</button>
		</div>
	);
}
