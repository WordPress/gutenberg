/**
 * WordPress dependencies
 */
import { withInstanceId } from '@wordpress/compose';
import { FormToggle } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

function BlockManagerHideAll( { instanceId, category, checked, onChange } ) {
	const id = 'edit-post-manage-blocks-modal__hide-all-' + instanceId;

	return (
		<div className="edit-post-manage-blocks-modal__hide-all">
			<label
				htmlFor={ id }
				className="edit-post-manage-blocks-modal__hide-all-label"
			>
				{
					/* translators: Checkbox toggle label */
					__( 'Hide all' )
				}
			</label>
			<FormToggle
				id={ id }
				checked={ checked }
				onChange={ ( event ) => onChange( event.target.checked ) }
				aria-label={ sprintf(
					/* translators: Block Visibility accessible checkbox toggle label */
					__( 'Hide all blocks in category: %s' ),
					category.title
				) }
			/>
		</div>
	);
}

export default withInstanceId( BlockManagerHideAll );
