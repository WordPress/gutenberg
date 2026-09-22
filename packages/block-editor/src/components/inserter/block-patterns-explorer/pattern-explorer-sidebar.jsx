import { SearchControl } from '@wordpress/components';
import { Stack, Tabs } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';

function PatternExplorerSidebar( {
	patternCategories,
	searchValue,
	setSearchValue,
} ) {
	return (
		<Stack
			direction="column"
			gap="lg"
			className="block-editor-block-patterns-explorer__sidebar"
		>
			<SearchControl
				onChange={ setSearchValue }
				value={ searchValue }
				label={ __( 'Search' ) }
				placeholder={ __( 'Search' ) }
			/>
			<Tabs.List>
				{ patternCategories.map( ( { name, label } ) => (
					<Tabs.Tab key={ name } value={ name }>
						{ label }
					</Tabs.Tab>
				) ) }
			</Tabs.List>
		</Stack>
	);
}

export default PatternExplorerSidebar;
