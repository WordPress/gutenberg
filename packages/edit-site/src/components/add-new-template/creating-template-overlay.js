/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';

export default function CreatingTemplateOverlay() {
	return (
		<div className="edit-site-creating-template-overlay">
			<Spinner />
		</div>
	);
}
