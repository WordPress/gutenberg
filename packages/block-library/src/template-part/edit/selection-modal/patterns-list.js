/**
 * WordPress dependencies
 */
import {
	__experimentalBlockPatternsList as BlockPatternsList,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useState, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	TextControl,
	Flex,
	FlexItem,
	Button,
	Modal,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useAsyncList } from '@wordpress/compose';

export default function PatternsList( {
	area,
	areaLabel,
	clientId,
	onSelect,
} ) {
	const blockNameWithArea = area
		? `core/template-part/${ area }`
		: 'core/template-part';
	const blockPatterns = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				__experimentalGetAllowedPatterns,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			return __experimentalGetAllowedPatterns( rootClientId );
		},
		[ clientId ]
	);
	const filteredBlockPatterns = useMemo( () => {
		return blockPatterns.filter( ( pattern ) =>
			pattern?.blockTypes?.some?.(
				( blockType ) => blockType === blockNameWithArea
			)
		);
	}, [ blockNameWithArea, blockPatterns ] );

	// Restructure onCreate to set the blocks on local state.
	// Add modal to confirm title and trigger onCreate.
	const [ title, setTitle ] = useState( __( 'Untitled Template Part' ) );
	const [ startingBlocks, setStartingBlocks ] = useState( [] );
	const [ isTitleStep, setIsTitleStep ] = useState( false );
	const shownPatterns = useAsyncList( filteredBlockPatterns );

	const submitForCreation = ( event ) => {
		event.preventDefault();
		onSelect( startingBlocks, title );
	};

	return (
		<>
			<BlockPatternsList
				blockPatterns={ filteredBlockPatterns }
				shownPatterns={ shownPatterns }
				onClickPattern={ ( _, blocks ) => {
					setStartingBlocks( blocks );
					setIsTitleStep( true );
				} }
			/>

			{ isTitleStep && (
				<Modal
					title={ sprintf(
						// Translators: %s as template part area title ("Header", "Footer", etc.).
						__( 'Name and create your new %s' ),
						areaLabel.toLowerCase()
					) }
					closeLabel={ __( 'Cancel' ) }
					overlayClassName="wp-block-template-part__placeholder-create-new__title-form"
					onRequestClose={ () => setIsTitleStep( false ) }
				>
					<form onSubmit={ submitForCreation }>
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
