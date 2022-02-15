/**
 * WordPress dependencies
 */
import {
	__experimentalBlockPatternsList as BlockPatternsList,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useAsyncList } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import TitleModal from './title-modal';

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
	const [ startingBlocks, setStartingBlocks ] = useState( [] );
	const [ isTitleStep, setIsTitleStep ] = useState( false );
	const shownPatterns = useAsyncList( filteredBlockPatterns );

	const onSubmitTitle = ( title ) => {
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
				<TitleModal
					areaLabel={ areaLabel }
					onClose={ () => setIsTitleStep( false ) }
					onSubmit={ onSubmitTitle }
				/>
			) }
		</>
	);
}
