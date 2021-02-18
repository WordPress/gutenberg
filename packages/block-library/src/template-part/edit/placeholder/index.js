/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { Placeholder, Dropdown, Button, Spinner } from '@wordpress/components';
import { blockDefault } from '@wordpress/icons';
import { serialize } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import TemplatePartSelection from '../selection';

export default function TemplatePartPlaceholder( {
	setAttributes,
	innerBlocks,
} ) {
	const { saveEntityRecord } = useDispatch( coreStore );
	const onCreate = useCallback( async () => {
		const title = __( 'Untitled Template Part' );
		const templatePart = await saveEntityRecord(
			'postType',
			'wp_template_part',
			{
				title,
				slug: 'template-part',
				content: serialize( innerBlocks ),
			}
		);
		setAttributes( {
			slug: templatePart.slug,
			theme: templatePart.theme,
		} );
	}, [ setAttributes ] );

	// If there are inner blocks present, the content for creation is clear.
	// Therefore immediately create the template part with the given inner blocks as its content.
	useEffect( () => {
		if ( innerBlocks.length ) {
			onCreate();
		}
	}, [] );
	if ( innerBlocks.length ) {
		return (
			<Placeholder>
				<Spinner />
			</Placeholder>
		);
	}

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
