/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Placeholder } from '@wordpress/components';
import { MediaUpload } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { bolt } from './../../icons/bolt';
import QuickInserterPopover from './../quick-inserter';

export default function IconPlaceholder( props ) {
	const {
		setInserterOpen,
		isQuickInserterOpen,
		setQuickInserterOpen,
		setAttributes,
	} = props;

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
				onClick={ () => setQuickInserterOpen( true ) }
				__next40pxDefaultSize
			>
				{ __( 'Icon Library' ) }
			</Button>
			<QuickInserterPopover
				setInserterOpen={ setInserterOpen }
				isQuickInserterOpen={ isQuickInserterOpen }
				setQuickInserterOpen={ setQuickInserterOpen }
				setAttributes={ setAttributes }
			/>
		</Placeholder>
	);
}
