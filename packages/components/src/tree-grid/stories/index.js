/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TreeGrid, { TreeGridRow, TreeGridCell } from '../';
import { Button } from '../../';

export default { title: 'Components/TreeGrid', component: TreeGrid };

const simpsonsCharacters = [
	{
		name: 'Homer',
		children: [
			{
				name: 'Lisa',
			},
			{
				name: 'Bart',
			},
			{
				name: 'Maggie',
			},
		],
	},
	{
		name: 'Ned',
		children: [
			{
				name: 'Rod',
			},
			{
				name: 'Todd',
			},
		],
	},
];

const Descender = ( { level } ) => {
	if ( level === 1 ) {
		return '';
	}
	const indentation = '\u00A0'.repeat( ( level - 1 ) * 4 );

	return <span aria-hidden="true">{ indentation + '├ ' }</span>;
};

const Rows = ( { people, level = 1 } ) => {
	return people.map( ( person, index ) => {
		const hasChildren = !! person.children && !! person.children.length;
		return (
			<Fragment key={ person.name }>
				<TreeGridRow
					positionInSet={ index + 1 }
					setSize={ people.length }
					level={ level }
				>
					<TreeGridCell>
						{ ( props ) => (
							<>
								<Descender level={ level } />
								<Button isPrimary { ...props }>
									{ person.name }
								</Button>
							</>
						) }
					</TreeGridCell>
					<TreeGridCell>
						{ ( props ) => (
							<Button isSecondary { ...props }>
								Vote Up
							</Button>
						) }
					</TreeGridCell>
					<TreeGridCell>
						{ ( props ) => (
							<Button isSecondary { ...props }>
								Vote Down
							</Button>
						) }
					</TreeGridCell>
				</TreeGridRow>
				{ hasChildren && (
					<Rows people={ person.children } level={ level + 1 } />
				) }
			</Fragment>
		);
	} );
};

export const _default = () => {
	return (
		<TreeGrid>
			<Rows people={ simpsonsCharacters } />
		</TreeGrid>
	);
};
