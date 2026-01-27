/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Warning from '../warning';

export default function BlockCrashWarning( { onTryCompatMode } ) {
	return (
		<Warning
			className="block-editor-block-list__block-crash-warning"
			actions={
				onTryCompatMode
					? [
							<Button
								key="compat-mode"
								onClick={ onTryCompatMode }
								variant="primary"
								__next40pxDefaultSize
							>
								{ __( 'Try Compatibility Mode' ) }
							</Button>,
					  ]
					: undefined
			}
		>
			{ __( 'This block has encountered an error and cannot be previewed.' ) }
		</Warning>
	);
}
