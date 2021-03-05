/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

export default function TermDescriptionEdit() {
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<div className="wp-block-post-content__placeholder">
				<span>
					{ __( 'This is a placeholder for term description.' ) }
				</span>
			</div>
		</div>
	);
}
