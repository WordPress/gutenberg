import { Modal } from '@wordpress/components';
import { Tabs } from '@wordpress/ui';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PatternExplorerSidebar from './pattern-explorer-sidebar';
import PatternList from './pattern-list';
import { usePatternCategories } from '../block-patterns-tab/use-pattern-categories';

function PatternsExplorer( { initialCategory, rootClientId, onModalClose } ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const [ selectedCategory, setSelectedCategory ] = useState(
		initialCategory?.name
	);

	const patternCategories = usePatternCategories( rootClientId );

	return (
		<Tabs.Root
			className="block-editor-block-patterns-explorer"
			orientation="vertical"
			value={ selectedCategory }
			onValueChange={ setSelectedCategory }
		>
			<PatternExplorerSidebar
				patternCategories={ patternCategories }
				searchValue={ searchValue }
				setSearchValue={ setSearchValue }
			/>
			{ patternCategories.map( ( { name } ) => (
				<Tabs.Panel
					key={ name }
					value={ name }
					tabIndex={ -1 }
					className="block-editor-block-patterns-explorer__panel"
				>
					<PatternList
						searchValue={ searchValue }
						selectedCategory={ name }
						patternCategories={ patternCategories }
						rootClientId={ rootClientId }
						onModalClose={ onModalClose }
					/>
				</Tabs.Panel>
			) ) }
		</Tabs.Root>
	);
}

function PatternsExplorerModal( { onModalClose, ...restProps } ) {
	return (
		<Modal
			title={ __( 'Patterns' ) }
			onRequestClose={ onModalClose }
			isFullScreen
		>
			<PatternsExplorer onModalClose={ onModalClose } { ...restProps } />
		</Modal>
	);
}

export default PatternsExplorerModal;
