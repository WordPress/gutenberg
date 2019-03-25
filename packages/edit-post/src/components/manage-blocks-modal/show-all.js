/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';
import { FormToggle } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function BlockManagerShowAll( { instanceId, checked, onChange } ) {
	const id = 'edit-post-manage-blocks-modal__show-all-' + instanceId;

	return (
		<div className="edit-post-manage-blocks-modal__show-all">
			<label
				htmlFor={ id }
				className="edit-post-manage-blocks-modal__show-all-label"
			>
				{
					/* translators: Checkbox toggle label */
					__( 'Show section' )
				}
			</label>
			<FormToggle
				id={ id }
				checked={ checked }
				onChange={ ( event ) => onChange( event.target.checked ) }
			/>
		</div>
	);
}

export default withInstanceId( BlockManagerShowAll );
