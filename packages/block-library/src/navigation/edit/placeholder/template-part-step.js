/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	Button,
	Dropdown,
	Flex,
	FlexItem,
	Modal,
	Placeholder,
	Spinner,
	TextControl,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import TemplatePartSelection from '../../../template-part/edit/selection';

export default function TemplatePartStep( {
	area,
	enableSelection,
	hasResolvedReplacements,
	onCreateNew,
	onSelectExisting,
} ) {
	const [ isNamingTemplatePart, setIsNamingTemplatePart ] = useState( false );
	const [ title, setTitle ] = useState( __( 'Untitled Menu' ) );

	const { areaIcon, areaLabel } = useSelect(
		( select ) => {
			// FIXME: @wordpress/block-library should not depend on @wordpress/editor.
			// Blocks can be loaded into a *non-post* block editor.
			// eslint-disable-next-line @wordpress/data-no-store-string-literals
			const definedAreas = select(
				'core/editor'
			).__experimentalGetDefaultTemplatePartAreas();

			const selectedArea = find( definedAreas, { area } );
			const defaultArea = find( definedAreas, { area: 'uncategorized' } );

			return {
				areaIcon: selectedArea?.icon || defaultArea?.icon,
				areaLabel: selectedArea?.label || __( 'Navigation' ),
			};
		},
		[ area ]
	);

	return (
		<>
			<Placeholder
				icon={ areaIcon }
				label={ areaLabel }
				instructions={
					enableSelection
						? sprintf(
								// Translators: %s as template part area title ("Header", "Footer", etc.).
								'Choose an existing %s or create a new one.',
								areaLabel.toLowerCase()
						  )
						: sprintf(
								// Translators: %s as template part area title ("Header", "Footer", etc.).
								'Create a new %s.',
								areaLabel.toLowerCase()
						  )
				}
			>
				{ ! hasResolvedReplacements ? (
					<Spinner />
				) : (
					<Dropdown
						contentClassName="wp-block-template-part__placeholder-preview-dropdown-content"
						position="bottom right left"
						renderToggle={ ( { isOpen, onToggle } ) => (
							<>
								{ enableSelection && (
									<Button
										variant="primary"
										onClick={ onToggle }
										aria-expanded={ isOpen }
									>
										{ __( 'Choose existing' ) }
									</Button>
								) }
								<Button
									variant={
										enableSelection ? 'tertiary' : 'primary'
									}
									onClick={ () => {
										setIsNamingTemplatePart( true );
									} }
								>
									{ sprintf(
										// Translators: %s as template part area title ("Header", "Footer", etc.).
										'New %s',
										areaLabel.toLowerCase()
									) }
								</Button>
							</>
						) }
						renderContent={ ( { onClose } ) => (
							<TemplatePartSelection
								// Seems like an anti-pattern that `TemplatePartSelection` passes around
								// `setAttributes`. Ideally this could be refactored, but for now, this
								// does the same thing with better semantic naming.
								setAttributes={ onSelectExisting }
								onClose={ onClose }
								area={ area }
							/>
						) }
					/>
				) }
			</Placeholder>
			{ isNamingTemplatePart && (
				<Modal
					title={ sprintf(
						'Name and create your new %s',
						areaLabel.toLowerCase()
					) }
					closeLabel={ __( 'Cancel' ) }
					onRequestClose={ () => {
						setIsNamingTemplatePart( false );
					} }
					overlayClassName="wp-block-template-part__placeholder-create-new__title-form"
				>
					<form
						onSubmit={ ( event ) => {
							event.preventDefault();
							onCreateNew( title );
						} }
					>
						<TextControl
							label={ __( 'Name' ) }
							value={ title }
							onChange={ setTitle }
						/>
						<Flex
							className="wp-block-template-part__placeholder-create-new__title-form-actions"
							justify="flex-end"
						>
							<FlexItem>
								<Button
									variant="secondary"
									onClick={ () => {
										setIsNamingTemplatePart( false );
									} }
								>
									{ __( 'Cancel' ) }
								</Button>
							</FlexItem>
							<FlexItem>
								<Button
									variant="primary"
									type="submit"
									disabled={ ! title.length }
									aria-disabled={ ! title.length }
								>
									{ __( 'Create' ) }
								</Button>
							</FlexItem>
						</Flex>
					</form>
				</Modal>
			) }
		</>
	);
}
