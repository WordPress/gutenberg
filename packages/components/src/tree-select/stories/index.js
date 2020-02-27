/**
 * WordPress dependencies
 */
import { withState } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import TreeSelect from '../';

export default { title: 'Components/TreeSelect', component: TreeSelect };

const TreeSelectStory = withState( {
	page: 'p21',
} )( ( { page, setState } ) => (
	<TreeSelect
		label="Parent page"
		noOptionLabel="No parent page"
		onChange={ ( pageId ) => setState( { page: pageId } ) }
		selectedId={ page }
		tree={ [
			{
				name: 'Page 1',
				id: 'p1',
				children: [
					{ name: 'Descend 1 of page 1', id: 'p11' },
					{ name: 'Descend 2 of page 1', id: 'p12' },
				],
			},
			{
				name: 'Page 2',
				id: 'p2',
				children: [
					{
						name: 'Descend 1 of page 2',
						id: 'p21',
						children: [
							{
								name: 'Descend 1 of Descend 1 of page 2',
								id: 'p211',
							},
						],
					},
				],
			},
		] }
		style={ { width: '400px' } }
	/>
) );

export const _default = () => {
	return <TreeSelectStory />;
};
