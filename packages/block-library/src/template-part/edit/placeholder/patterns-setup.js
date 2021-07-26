/**
 * WordPress dependencies
 */
import { __experimentalBlockPatternSetup as BlockPatternSetup } from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	TextControl,
	Flex,
	FlexItem,
	Button,
	Modal,
} from '@wordpress/components';

export default function PatternsSetup( {
	area,
	areaLabel,
	clientId,
	onCreate,
	resetPlaceholder,
} ) {
	const blockNameWithArea = area
		? `core/template-part/${ area }`
		: 'core/template-part';

	// Restructure onCreate to set the blocks on local state.
	// Add modal to confirm title and trigger onCreate.
	const [ title, setTitle ] = useState( __( 'Untitled Template Part' ) );
	const [ startingBlocks, setStartingBlocks ] = useState( [] );
	const [ isTitleStep, setIsTitleStep ] = useState( false );

	const selectPattern = ( selectedPattern ) => {
		setStartingBlocks( selectedPattern );
		setIsTitleStep( true );
	};

	return (
		<>
			<BlockPatternSetup
				clientId={ clientId }
				startBlankComponent={
					<StartBlankComponent setTitleStep={ setIsTitleStep } />
				}
				onBlockPatternSelect={ selectPattern }
				filterPatternsFn={ ( pattern ) =>
					pattern?.blockTypes?.some?.(
						( blockType ) => blockType === blockNameWithArea
					)
				}
			/>
			{ isTitleStep && (
				<Modal
					title={ sprintf(
						'Name and create your new %s',
						areaLabel.toLowerCase()
					) }
					closeLabel={ __( 'Cancel' ) }
					onRequestClose={ () => {
						resetPlaceholder();
					} }
					overlayClassName="edit-site-template-part-converter__modal"
				>
					<form
						onSubmit={ ( event ) => {
							event.preventDefault();
							onCreate( startingBlocks, title );
						} }
					>
						<TextControl
							label={ __( 'Name' ) }
							value={ title }
							onChange={ setTitle }
						/>
						<Flex
							className="edit-site-template-part-converter__convert-modal-actions"
							justify="flex-end"
						>
							<FlexItem>
								<Button
									variant="secondary"
									onClick={ () => {
										resetPlaceholder();
									} }
								>
									{ __( 'Cancel' ) }
								</Button>
							</FlexItem>
							<FlexItem>
								<Button variant="primary" type="submit">
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

function StartBlankComponent( { setTitleStep } ) {
	useEffect( () => {
		setTitleStep( true );
	}, [] );
	return null;
}
