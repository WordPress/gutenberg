/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { FormToggle } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function BlockManagerShowAll( { checked, onChange } ) {
	const instanceId = useInstanceId( BlockManagerShowAll );
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
