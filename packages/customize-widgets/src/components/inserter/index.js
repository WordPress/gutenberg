/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalLibrary as Library } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as customizeWidgetsStore } from '../../store';

function Inserter( { setIsOpened } ) {
	const inserterTitleId = useInstanceId(
		Inserter,
		'customize-widget-layout__inserter-panel-title'
	);
	const insertionPoint = useSelect(
		( select ) =>
			select( customizeWidgetsStore ).__experimentalGetInsertionPoint(),
		[]
	);

	return (
		<div
			className="customize-widgets-layout__inserter-panel"
			aria-labelledby={ inserterTitleId }
		>
			<div className="customize-widgets-layout__inserter-panel-header">
				<h2
					id={ inserterTitleId }
					className="customize-widgets-layout__inserter-panel-header-title"
				>
					{ __( 'Add a block' ) }
				</h2>
				<Button
					size="small"
					icon={ closeSmall }
					onClick={ () => setIsOpened( false ) }
					aria-label={ __( 'Close inserter' ) }
				/>
			</div>
			<div className="customize-widgets-layout__inserter-panel-content">
				<Library
					rootClientId={ insertionPoint.rootClientId }
					__experimentalInsertionIndex={
						insertionPoint.insertionIndex
					}
					showInserterHelpPanel
					onSelect={ () => setIsOpened( false ) }
				/>
			</div>
		</div>
	);
}

export default Inserter;
