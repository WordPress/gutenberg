/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { cleanForSlug } from '@wordpress/url';
import { Placeholder, Dropdown, Button } from '@wordpress/components';
import { blockDefault } from '@wordpress/icons';
import { __experimentalSearchForm as SearchForm } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import TemplatePartPreviews from './template-part-previews';

export default function TemplatePartPlaceholder( { setAttributes } ) {
	const { saveEntityRecord } = useDispatch( 'core' );
	const onCreate = useCallback( async () => {
		const title = 'Untitled Template Part';
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
			label={ __( 'Template Part' ) }
			instructions={ __(
				'Create a new template part or pick an existing one from the list.'
			) }
		>
			<Dropdown
				contentClassName="wp-block-template-part__placeholder-preview-dropdown-content"
				position="bottom right left"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<>
						<Button
							isPrimary
							onClick={ onToggle }
							aria-expanded={ isOpen }
						>
							{ __( 'Choose existing' ) }
						</Button>
						<Button isTertiary onClick={ onCreate }>
							{ __( 'New template part' ) }
						</Button>
					</>
				) }
				renderContent={ () => (
					<>
						<SearchForm
							onChange={ setFilterValue }
							className="wp-block-template-part__placeholder-preview-search-form"
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
