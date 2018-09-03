/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

export default function createLevelControl( targetLevel, selectedLevel, setAttributes ) {
	return {
		icon: 'heading',
		// translators: %s: heading level e.g: "1", "2", "3"
		title: sprintf( __( 'Heading %d' ), targetLevel ),
		isActive: targetLevel === selectedLevel,
		onClick: () => setAttributes( { level: targetLevel } ),
		subscript: String( targetLevel ),
	};
}
