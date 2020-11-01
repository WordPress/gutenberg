/**
 * WordPress dependencies
 */
import { __experimentalLibrary as Library } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { close } from '@wordpress/icons';

const InserterPanel = ( { closeInserter } ) => {
	const isMobile = useViewportMatch( 'medium', '<' );

	return (
		<div className="edit-site-inserter-panel">
			<div className="edit-site-inserter-panel__header">
				<Button icon={ close } onClick={ closeInserter } />
			</div>
			<div className="edit-site-inserter-panel__content">
				<Library
					showInserterHelpPanel
					onSelect={ () => {
						if ( isMobile ) {
							closeInserter();
						}
					} }
				/>
			</div>
		</div>
	);
};

export default InserterPanel;
