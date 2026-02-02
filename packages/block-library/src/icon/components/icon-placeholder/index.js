/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Placeholder } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { bolt } from './../../icons/';

export default function IconPlaceholder( { setInserterOpen } ) {
	return (
		<Placeholder
			icon={ bolt }
			label={ __( 'Icon' ) }
			instructions={ __(
				'Browse the icon library and choose one to insert.'
			) }
		>
			<Button
				variant="primary"
				onClick={ () => setInserterOpen( true ) }
				__next40pxDefaultSize
			>
				{ __( 'Icon Library' ) }
			</Button>
		</Placeholder>
	);
}
