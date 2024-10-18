/**
 * Internal dependencies
 */
import BlockPatternsList from '../';
import patterns from './fixtures';

export default {
	component: BlockPatternsList,
	title: 'BlockEditor/BlockPatternsList',
};

export const Default = {
	render: function Template( props ) {
		return (
			<div style={ { width: '500px' } }>
				<BlockPatternsList { ...props } />
			</div>
		);
	},
	args: {
		shownPatterns: patterns,
		blockPatterns: patterns,
		onClick: () => {},
		isDraggable: false,
		label: 'Block patterns story',
		showTitle: true,
	},
};
