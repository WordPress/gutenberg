/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextareaControl } from '@wordpress/components';
import { Link } from '@wordpress/ui';
import type { Field } from '@wordpress/dataviews';
import type { Attachment, Updatable } from '@wordpress/core-data';

const altTextField: Partial< Field< Updatable< Attachment > > > = {
	id: 'alt_text',
	type: 'text',
	label: __( 'Alt text' ),
	isVisible: ( item ) => item?.media_type === 'image',
	render: ( { item } ) => item?.alt_text || '-',
	Edit: ( { field, onChange, data } ) => {
		return (
			<TextareaControl
				label={ field.label }
				value={ data.alt_text || '' }
				onChange={ ( value ) => onChange( { alt_text: value } ) }
				help={
					<>
						<Link
							href={
								// translators: Localized tutorial, if one exists. W3C Web Accessibility Initiative link has list of existing translations.
								__(
									'https://www.w3.org/WAI/tutorials/images/decision-tree/'
								)
							}
							openInNewTab
						>
							{ __( 'Describe the purpose of the image.' ) }
						</Link>
						<br />
						{ __( 'Leave empty if decorative.' ) }
					</>
				}
				rows={ 2 }
			/>
		);
	},
	enableSorting: false,
	filterBy: false,
};

export default altTextField;
