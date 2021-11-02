/**
 * WordPress dependencies
 */
import { useConstrainedTabbing } from '@wordpress/compose';
import { Placeholder } from '@wordpress/components';

/**
 * Internal dependencies
 */
import EmbeddedAdminContext from '../embedded-admin-context';

/**
 * Placeholder for use in blocks. Creates an admin styling context and a tabbing
 * context in the block editor's writing flow.
 *
 * @param {Object} props
 *
 * @return {WPComponent} The component
 */
export default function IsolatedPlaceholder( props ) {
	return (
		<EmbeddedAdminContext
			aria-label={ props.label }
			className="wp-block-editor-placeholder"
		>
			<Placeholder
				{ ...props }
				role="dialog"
				ref={ useConstrainedTabbing() }
			/>
		</EmbeddedAdminContext>
	);
}
