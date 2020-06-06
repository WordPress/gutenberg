/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { blockDefault } from '@wordpress/icons';
import { BlockIcon } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function BlockArea( { clientId } ) {
	const { name, selectedBlock } = useSelect(
		( select ) => {
			const { getBlockAttributes, getBlockSelectionStart } = select(
				'core/block-editor'
			);
			return {
				name: getBlockAttributes( clientId ).name,
				selectedBlock: getBlockSelectionStart(),
			};
		},
		[ clientId ]
	);
	const { selectBlock } = useDispatch( 'core/block-editor' );
	const isSelected = selectedBlock === clientId;
	return (
		<li>
			<Button
				aria-expanded={ isSelected }
				onClick={
					isSelected
						? undefined
						: () => {
								selectBlock( clientId );
						  }
				}
			>
				{ name }
				<span className="edit-widgets-block-areas__edit">
					{ __( 'Edit' ) }
				</span>
			</Button>
		</li>
	);
}

export default function BlockAreas() {
	const blockOrder = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getBlockOrder();
	} );
	const hasBlockAreas = blockOrder.length > 0;
	return (
		<>
			<div className="edit-widgets-block-areas">
				<div className="edit-widgets-block-areas__top-container">
					<BlockIcon icon={ blockDefault } />
					<div>
						<p>
							{ __(
								'Block Areas (also known as "Widget Areas") are global parts in your site\'s layout that can accept blocks. These vary by theme, but are typically parts like your Sidebar or Footer.'
							) }
						</p>
						{ ! hasBlockAreas && (
							<p>
								{ __(
									'Your theme does not contain block areas.'
								) }
							</p>
						) }
					</div>
				</div>
				{ hasBlockAreas && (
					<ul>
						{ blockOrder.map( ( clientId ) => (
							<BlockArea key={ clientId } clientId={ clientId } />
						) ) }
					</ul>
				) }
			</div>
		</>
	);
}
