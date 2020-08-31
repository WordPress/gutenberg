/**
 * WordPress dependencies
 */
import { Dropdown, MenuGroup, MenuItem, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';

function PatternInserterPanel( {
	title,
	selectedCategory,
	patternCategories,
	onClickCategory,
	children,
} ) {
	const renderToggle = ( { isOpen, onToggle } ) => (
		<h2 className="block-editor-inserter__panel-title">
			{ __( 'Viewing' ) }:
			<Button onClick={ onToggle } aria-expanded={ isOpen }>
				{ title ? title : selectedCategory.label }
			</Button>
		</h2>
	);

	const renderContent = ( { onClose } ) => {
		return (
			<MenuGroup label={ __( 'Select a Category' ) }>
				{ patternCategories.map( ( patternCategory ) => {
					return (
						<MenuItem
							key={ patternCategory.name }
							onClick={ () => {
								onClickCategory( patternCategory );
								onClose();
							} }
							className={
								patternCategory.name === selectedCategory.name
									? 'is-selected'
									: ''
							}
							icon={ check }
						>
							{ patternCategory.label }
						</MenuItem>
					);
				} ) }
			</MenuGroup>
		);
	};

	return (
		<>
			<div className="block-editor-inserter__panel-header">
				<Dropdown
					className="block-editor-inserter__panel-header-dropdown"
					contentClassName="block-editor-inserter__panel-header-dropdown-content"
					position="bottom right"
					renderToggle={ renderToggle }
					renderContent={ renderContent }
				/>
			</div>
			<div className="block-editor-inserter__panel-content">
				{ children }
			</div>
		</>
	);
}

export default PatternInserterPanel;
