/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { blockDefault } from '@wordpress/icons';
import { BlockIcon } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function WidgetArea( { block } ) {
	const selectedBlock = useSelect(
		( select ) => select( 'core/block-editor' ).getBlockSelectionStart(),
		[]
	);

	const { selectBlock } = useDispatch( 'core/block-editor' );

	if ( block.name !== 'core/widget-area' ) {
		return null;
	}

	return (
		<li>
			<Button
				aria-expanded={ selectedBlock === block.clientId }
				onClick={ () => selectBlock( block.clientId ) }
			>
				{ block.attributes.name }
				<span className="edit-widgets-widget-areas__edit">
					{ __( 'Edit' ) }
				</span>
			</Button>
		</li>
	);
}

export default function WidgetAreas() {
	const blocks = useSelect(
		( select ) => select( 'core/block-editor' ).getBlocks(),
		[]
	);

	const hasWidgetAreas = blocks.length > 0;

	return (
		<>
			<div className="edit-widgets-widget-areas">
				<div className="edit-widgets-widget-areas__top-container">
					<BlockIcon icon={ blockDefault } />
					<div>
						<p>
							{ __(
								"Widget Areas are global parts in your site's layout that can accept blocks. These vary by theme, but are typically parts like your Sidebar or Footer."
							) }
						</p>
						{ ! hasWidgetAreas && (
							<p>
								{ __(
									'Your theme does not contain any Widget Areas.'
								) }
							</p>
						) }
					</div>
				</div>

				{ hasWidgetAreas && (
					<ul>
						{ blocks.map( ( block ) => (
							<WidgetArea
								key={ block.clientId }
								block={ block }
							/>
						) ) }
					</ul>
				) }
			</div>
		</>
	);
}
