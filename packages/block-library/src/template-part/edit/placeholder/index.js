/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { cleanForSlug } from '@wordpress/url';
import {
	Placeholder,
	TextControl,
	Dropdown,
	ButtonGroup,
	Button,
} from '@wordpress/components';
import { blockDefault } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import TemplatePartPreviews from './template-part-previews';

export default function TemplatePartPlaceholder( { setAttributes } ) {
	const { saveEntityRecord } = useDispatch( 'core' );
	const onCreate = useCallback( async () => {
		const title = 'Untitled Section';
		const slug = cleanForSlug( title );
		const templatePart = await saveEntityRecord(
			'postType',
			'wp_template_part',
			{
				title,
				status: 'publish',
				slug,
				meta: { theme: 'custom' },
			}
		);
		setAttributes( {
			postId: templatePart.id,
			slug: templatePart.slug,
			theme: templatePart.meta.theme,
		} );
	}, [ setAttributes ] );

	const [ filterValue, setFilterValue ] = useState( '' );
	return (
		<Placeholder
			icon={ blockDefault }
			label={ __( 'Section' ) }
			instructions={ __(
				'Create a new section or pick one from a list of available sections.'
			) }
		>
			<Dropdown
				position="bottom left right"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<ButtonGroup>
						<Button
							isPrimary
							onClick={ onToggle }
							aria-expanded={ isOpen }
						>
							{ __( 'Choose existing' ) }
						</Button>
						<Button onClick={ onCreate }>
							{ __( 'New section' ) }
						</Button>
					</ButtonGroup>
				) }
				renderContent={ () => (
					<>
						<TextControl
							label={ __( 'Search' ) }
							placeholder={ __( 'header' ) }
							value={ filterValue }
							onChange={ setFilterValue }
							className="wp-block-template-part__placeholder-preview-filter-input"
						/>
						<div className="wp-block-template-part__placeholder-preview-container">
							<TemplatePartPreviews
								setAttributes={ setAttributes }
								filterValue={ filterValue }
							/>
						</div>
					</>
				) }
			/>
		</Placeholder>
	);
}
