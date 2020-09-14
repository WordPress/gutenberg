/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { cleanForSlug } from '@wordpress/url';
import { Placeholder, Dropdown, Button } from '@wordpress/components';
import { blockDefault } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import TemplatePartSelection from '../selection';

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
				renderContent={ ( { onClose } ) => (
					<TemplatePartSelection
						setAttributes={ setAttributes }
						onClose={ onClose }
					/>
				) }
			/>
		</Placeholder>
	);
}
