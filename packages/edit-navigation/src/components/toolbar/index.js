/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { NavigableToolbar, BlockToolbar } from '@wordpress/block-editor';

export default function Toolbar( { isPending } ) {
	return (
		<div className="edit-navigation-toolbar">
			{ isPending ? (
				<Spinner />
			) : (
				<>
					<NavigableToolbar
						className="edit-navigation-toolbar__block-tools"
						aria-label={ __( 'Block tools' ) }
					>
						<BlockToolbar />
					</NavigableToolbar>
				</>
			) }
		</div>
	);
}
