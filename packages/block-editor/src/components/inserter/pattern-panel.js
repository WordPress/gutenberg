/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { ButtonGroup, Button } from '@wordpress/components';

function PatternInserterPanel( {
	patternCategories,
	onClickCategory,
	children,
} ) {
	const onChangeSelect = ( selected ) => {
		onClickCategory(
			patternCategories.find(
				( patternCategory ) => selected === patternCategory.name
			)
		);
	};

	const getPanelHeaderClassName = () => {
		return classnames(
			'block-editor-inserter__panel-header',
			'block-editor-inserter__panel-header-patterns'
		);
	};

	return (
		<>
			<div className={ getPanelHeaderClassName() }>
				<ButtonGroup className="block-editor-inserter__panel-chips">
					{ patternCategories.map( ( patternCategory ) => {
						return (
							<Button
								key={ patternCategory.name }
								onClick={ () => {
									onChangeSelect( patternCategory.name );
								} }
							>
								{ patternCategory.label }
							</Button>
						);
					} ) }
				</ButtonGroup>
			</div>
			<div className="block-editor-inserter__panel-content">
				{ children }
			</div>
		</>
	);
}

export default PatternInserterPanel;
