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
import { parseUploadedMediaAndSetIcon } from '../../utils';
import QuickInserterPopover from './../quick-inserter';

export default function IconPlaceholder( props ) {
	const {
		setInserterOpen,
		isQuickInserterOpen,
		setQuickInserterOpen,
		setCustomInserterOpen,
		attributes,
		setAttributes,
		enableCustomIcons,
		isSVGUploadAllowed,
	} = props;

	const instructions = () => {
		const messages = {
			default: __(
				'Choose an icon from the library, pick one from your media library, or insert a custom SVG.'
			),
			noCustom: __(
				'Choose an icon from the library or pick one from your media library.'
			),
			noMediaLibrary: __(
				'Choose an icon from the library or insert a custom SVG.'
			),
			noCustomNoMediaLibrary: __(
				'Browse the icon library and choose one to insert.'
			),
		};

		if ( ! enableCustomIcons && ! isSVGUploadAllowed ) {
			return messages.noCustomNoMediaLibrary;
		} else if ( ! enableCustomIcons ) {
			return messages.noCustom;
		} else if ( ! isSVGUploadAllowed ) {
			return messages.noMediaLibrary;
		}

		return messages.default;
	};

	return (
		<Placeholder
			icon={ bolt }
			label={ __( 'Icon' ) }
			instructions={ instructions() }
		>
			<Button
				variant="primary"
				onClick={ () => setQuickInserterOpen( true ) }
				__next40pxDefaultSize
			>
				{ __( 'Icon Library' ) }
			</Button>
			{ isSVGUploadAllowed && (
				<MediaUpload
					onSelect={ ( media ) =>
						parseUploadedMediaAndSetIcon(
							media,
							attributes,
							setAttributes
						)
					}
					allowedTypes={ [ 'image/svg+xml' ] }
					render={ ( { open } ) => (
						<Button
							variant="secondary"
							onClick={ open }
							__next40pxDefaultSize
						>
							{ __( 'Media Library' ) }
						</Button>
					) }
				/>
			) }
			{ enableCustomIcons && (
				<Button
					variant="secondary"
					onClick={ () => setCustomInserterOpen( true ) }
					__next40pxDefaultSize
				>
					{ __( 'Insert custom SVG' ) }
				</Button>
			) }
			<QuickInserterPopover
				setInserterOpen={ setInserterOpen }
				isQuickInserterOpen={ isQuickInserterOpen }
				setQuickInserterOpen={ setQuickInserterOpen }
				setAttributes={ setAttributes }
			/>
		</Placeholder>
	);
}
