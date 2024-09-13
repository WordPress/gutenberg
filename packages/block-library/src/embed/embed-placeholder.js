/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import {
	Button,
	Placeholder,
	ExternalLink,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalInputControl as InputControl,
} from '@wordpress/components';
import { BlockIcon } from '@wordpress/block-editor';

const EmbedPlaceholder = ( {
	icon,
	label,
	value,
	onSubmit,
	onChange,
	cannotEmbed,
	fallback,
	tryAgain,
} ) => {
	return (
		<Placeholder
			icon={ <BlockIcon icon={ icon } showColors /> }
			label={ label }
			className="wp-block-embed"
			instructions={ __(
				'Paste a link to the content you want to display on your site.'
			) }
		>
			<form onSubmit={ onSubmit }>
				<InputControl
					__next40pxDefaultSize
					type="url"
					value={ value || '' }
					className="wp-block-embed__placeholder-input"
					label={ label }
					hideLabelFromVision
					placeholder={ __( 'Enter URL to embed here…' ) }
					onChange={ onChange }
				/>
				<Button __next40pxDefaultSize variant="primary" type="submit">
					{ _x( 'Embed', 'button label' ) }
				</Button>
			</form>
			<div className="wp-block-embed__learn-more">
				<ExternalLink
					href={ __(
						'https://wordpress.org/documentation/article/embeds/'
					) }
				>
					{ __( 'Learn more about embeds' ) }
				</ExternalLink>
			</div>
			{ cannotEmbed && (
				<VStack spacing={ 3 } className="components-placeholder__error">
					<div className="components-placeholder__instructions">
						{ __( 'Sorry, this content could not be embedded.' ) }
					</div>
					<HStack
						expanded={ false }
						spacing={ 3 }
						justify="flex-start"
					>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							onClick={ tryAgain }
						>
							{ _x( 'Try again', 'button label' ) }
						</Button>{ ' ' }
						<Button
							__next40pxDefaultSize
							variant="secondary"
							onClick={ fallback }
						>
							{ _x( 'Convert to link', 'button label' ) }
						</Button>
					</HStack>
				</VStack>
			) }
		</Placeholder>
	);
};

export default EmbedPlaceholder;
