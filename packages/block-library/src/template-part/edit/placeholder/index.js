/**
 * External dependencies
 */
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Placeholder, Dropdown, Button } from '@wordpress/components';
import { serialize } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import TemplatePartSelection from '../selection';
import PatternsSetup from './patterns-setup';

const PLACEHOLDER_STEPS = {
	initial: 1,
	patterns: 2,
};

export default function TemplatePartPlaceholder( {
	area,
	clientId,
	setAttributes,
	enableSelection,
} ) {
	const { saveEntityRecord } = useDispatch( coreStore );
	const [ step, setStep ] = useState( PLACEHOLDER_STEPS.initial );

	const { areaIcon, areaLabel } = useSelect(
		( select ) => {
			const definedAreas = select(
				editorStore
			).__experimentalGetDefaultTemplatePartAreas();

			const selectedArea = find( definedAreas, { area } );
			const defaultArea = find( definedAreas, { area: 'uncategorized' } );

			return {
				areaIcon: selectedArea?.icon || defaultArea?.icon,
				areaLabel: selectedArea?.label || __( 'Template Part' ),
			};
		},
		[ area ]
	);

	const onCreate = useCallback(
		async ( startingBlocks = [] ) => {
			const title = __( 'Untitled Template Part' );
			// If we have `area` set from block attributes, means an exposed
			// block variation was inserted. So add this prop to the template
			// part entity on creation. Afterwards remove `area` value from
			// block attributes.
			const record = {
				title,
				slug: 'template-part',
				content: serialize( startingBlocks ),
				// `area` is filterable on the server and defaults to `UNCATEGORIZED`
				// if provided value is not allowed.
				area,
			};
			const templatePart = await saveEntityRecord(
				'postType',
				'wp_template_part',
				record
			);
			setAttributes( {
				slug: templatePart.slug,
				theme: templatePart.theme,
				area: undefined,
			} );
		},
		[ setAttributes, area ]
	);

	return (
		<>
			{ step === PLACEHOLDER_STEPS.initial && (
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
									onClick={ () =>
										setStep( PLACEHOLDER_STEPS.patterns )
									}
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
								setAttributes={ setAttributes }
								onClose={ onClose }
								area={ area }
							/>
						) }
					/>
				</Placeholder>
			) }
			{ step === PLACEHOLDER_STEPS.patterns && (
				<PatternsSetup
					area={ area }
					onCreate={ onCreate }
					clientId={ clientId }
				/>
			) }
		</>
	);
}
