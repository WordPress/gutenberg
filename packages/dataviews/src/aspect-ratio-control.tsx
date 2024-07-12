/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { fullscreen } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { ViewGrid } from './types';

export default function AspectRatioControl( {
	view,
	onChangeView,
}: {
	view: ViewGrid;
	onChangeView: ( view: ViewGrid ) => void;
} ) {
	const hasOneAspectRatio = view.layout?.hasOneOneAspectRatio !== false;
	return (
		<>
			<Button
				size="compact"
				isPressed={ hasOneAspectRatio }
				icon={ fullscreen }
				label={
					hasOneAspectRatio
						? __( 'Change aspect ratio to auto' )
						: __( 'Change aspect ratio to 1:1' )
				}
				onClick={ () => {
					if ( hasOneAspectRatio ) {
						onChangeView( {
							...view,
							layout: {
								...view.layout,
								hasOneOneAspectRatio: false,
							},
						} );
					} else if ( view.layout ) {
						const { hasOneOneAspectRatio, ...layout } = view.layout;
						onChangeView( {
							...view,
							layout,
						} );
					}
				} }
			/>
		</>
	);
}
