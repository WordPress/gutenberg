/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { widget } from '@wordpress/icons';
import { BlockIcon } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function BlockArea( { clientId } ) {
	const { name } = useSelect(
		( select ) => {
			return select( 'core/block-editor' ).getBlockAttributes( clientId );
		},
		[ clientId ]
	);
	const { selectBlock } = useDispatch( 'core/block-editor' );
	return (
		<li>
			<Button
				onClick={ () => {
					selectBlock( clientId );
				} }
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
					<BlockIcon icon={ widget } />
					<div>
						<p>
							{ __(
								'Block areas (also known as “Widget Areas”) are global locations in your site’s layout that can accept blocks. These vary by theme, but are typically places like your sidebar or footer.'
							) }
						</p>
						<span>
							{ hasBlockAreas
								? __(
										'Your theme contains the following block areas:'
								  )
								: __(
										'Your theme does not contain block areas.'
								  ) }
						</span>
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
