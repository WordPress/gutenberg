/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useAsyncList } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { __experimentalBlockPatternsList as BlockPatternsList } from '../';

function useStarterPatterns( postType, rootClientId ) {
	// A pattern is a start pattern if it includes 'core/post-content' in its blockTypes,
	// and it has no postTypes declared and the current post type is page or if
	// the current post type is part of the postTypes declared.
	const blockPatternsWithPostContentBlockType = useSelect(
		( select ) =>
			select( blockEditorStore ).getPatternsByBlockTypes(
				'core/post-content',
				rootClientId
			),
		[ rootClientId ]
	);

	return useMemo( () => {
		// filter patterns without postTypes declared if the current postType is page
		// or patterns that declare the current postType in its post type array.
		return blockPatternsWithPostContentBlockType.filter( ( pattern ) => {
			return (
				( postType === 'page' && ! pattern.postTypes ) ||
				( Array.isArray( pattern.postTypes ) &&
					pattern.postTypes.includes( postType ) )
			);
		} );
	}, [ postType, blockPatternsWithPostContentBlockType ] );
}

export default function StarterPatternsModal( {
	onChoosePattern,
	onRequestClose,
	postType,
	rootClientId,
} ) {
	const starterPatterns = useStarterPatterns( postType, rootClientId );
	const shownStarterPatterns = useAsyncList( starterPatterns );

	if ( starterPatterns.length === 0 ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Choose a pattern' ) }
			isFullScreen
			onRequestClose={ onRequestClose }
		>
			<div className="block-editor-starter-patterns-modal__content">
				<BlockPatternsList
					blockPatterns={ starterPatterns }
					shownPatterns={ shownStarterPatterns }
					onClickPattern={ onChoosePattern }
				/>
			</div>
		</Modal>
	);
}
