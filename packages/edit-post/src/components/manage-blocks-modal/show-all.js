/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';
import { FormToggle } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

function BlockManagerShowAll( { instanceId, category, checked, onChange } ) {
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
				aria-label={ sprintf(
					/* translators: Block Visibility accessible checkbox toggle label */
					__( 'Show all blocks in section: %s' ),
					category.title
				) }
			/>
		</div>
	);
}

export default withInstanceId( BlockManagerShowAll );
