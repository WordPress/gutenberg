/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { usePrevious } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PatternExplorerSidebar from './sidebar';
import PatternList from './patterns-list';
import { usePatternsCategories } from '../block-patterns-tab';
import { store as blockEditorStore } from '../../../store';

function PatternsExplorer( { initialCategory, rootClientId } ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const [ patternSourceFilter, setPatternSourceFilter ] = useState( 'all' );
	const patternSyncFilter = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const settings = getSettings();
		return settings.patternsSyncFilter || 'all';
	}, [] );
	const [ selectedCategory, setSelectedCategory ] = useState(
		initialCategory?.name
	);

	const previousSyncFilter = usePrevious( patternSyncFilter );

	// If the sync filter changes, we need to select the "All" category to avoid
	// showing a confusing no results screen.
	useEffect( () => {
		if ( patternSyncFilter && patternSyncFilter !== previousSyncFilter ) {
			setSelectedCategory( initialCategory?.name );
		}
	}, [
		patternSyncFilter,
		previousSyncFilter,
		patternSourceFilter,
		initialCategory?.name,
	] );

	const patternCategories = usePatternsCategories(
		rootClientId,
		patternSourceFilter,
		patternSyncFilter
	);

	return (
		<div className="block-editor-block-patterns-explorer">
			<PatternExplorerSidebar
				selectedCategory={ selectedCategory }
				patternCategories={ patternCategories }
				onClickCategory={ setSelectedCategory }
				searchValue={ searchValue }
				setSearchValue={ setSearchValue }
				patternSourceFilter={ patternSourceFilter }
				setPatternSourceFilter={ setPatternSourceFilter }
			/>
			<PatternList
				searchValue={ searchValue }
				selectedCategory={ selectedCategory }
				patternCategories={ patternCategories }
				patternSourceFilter={ patternSourceFilter }
				patternSyncFilter={ patternSyncFilter }
			/>
		</div>
	);
}

function PatternsExplorerModal( { onModalClose, ...restProps } ) {
	return (
		<Modal
			title={ __( 'Patterns' ) }
			onRequestClose={ onModalClose }
			isFullScreen
		>
			<PatternsExplorer { ...restProps } />
		</Modal>
	);
}

export default PatternsExplorerModal;
