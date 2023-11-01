/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Placeholder, Button, Spinner } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	useAlternativeBlockPatterns,
	useAlternativeTemplateParts,
	useCreateTemplatePartFromBlocks,
	useTemplatePartArea,
} from './utils/hooks';
import TitleModal from './title-modal';

export default function TemplatePartPlaceholder( {
	area,
	clientId,
	templatePartId,
	onOpenSelectionModal,
	setAttributes,
} ) {
	const { templateParts, isResolving } = useAlternativeTemplateParts(
		area,
		templatePartId
	);
	const blockPatterns = useAlternativeBlockPatterns( area, clientId );
	const [ showTitleModal, setShowTitleModal ] = useState( false );
	const areaObject = useTemplatePartArea( area );
	const createFromBlocks = useCreateTemplatePartFromBlocks(
		area,
		setAttributes
	);

	return (
		<Placeholder
			icon={ areaObject.icon }
			label={ areaObject.label }
			instructions={ sprintf(
				// Translators: %s as template part area title ("Header", "Footer", etc.).
				__( 'Choose an existing %s or create a new one.' ),
				areaObject.label.toLowerCase()
			) }
		>
			{ isResolving && <Spinner /> }

			{ ! isResolving &&
				!! ( templateParts.length || blockPatterns.length ) && (
					<Button variant="primary" onClick={ onOpenSelectionModal }>
						{ __( 'Choose' ) }
					</Button>
				) }

			{ ! isResolving && (
				<Button
					variant="secondary"
					onClick={ () => {
						setShowTitleModal( true );
					} }
				>
					{ __( 'Start blank' ) }
				</Button>
			) }
			{ showTitleModal && (
				<TitleModal
					areaLabel={ areaObject.label }
					onClose={ () => setShowTitleModal( false ) }
					onSubmit={ ( title ) => {
						createFromBlocks( [], title );
					} }
				/>
			) }
		</Placeholder>
	);
}
