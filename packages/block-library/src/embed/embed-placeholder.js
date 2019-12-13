/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Button, Placeholder, ExternalLink } from '@wordpress/components';
import { BlockIcon } from '@wordpress/block-editor';

const EmbedPlaceholder = ( props ) => {
	const { icon, label, value, onSubmit, onChange, cannotEmbed, fallback, tryAgain } = props;
	return (
		<Placeholder
			icon={ <BlockIcon icon={ icon } showColors /> }
			label={ label }
			className="wp-block-embed"
			instructions={ __( 'Paste a link to the content you want to display on your site.' ) }
		>
			<form onSubmit={ onSubmit }>
				<input
					type="url"
					value={ value || '' }
					className="components-placeholder__input"
					aria-label={ label }
					placeholder={ __( 'Enter URL to embed here…' ) }
					onChange={ onChange } />
				<Button
					isSecondary
					type="submit"
				>
					{ _x( 'Embed', 'button label' ) }
				</Button>
				{ cannotEmbed &&
					<p className="components-placeholder__error">
						{ __( 'Sorry, this content could not be embedded.' ) }<br />
						<Button isSecondary onClick={ tryAgain }>{ _x( 'Try again', 'button label' ) }</Button> <Button isSecondary onClick={ fallback }>{ _x( 'Convert to link', 'button label' ) }</Button>
					</p>
				}
			</form>
			<div className="components-placeholder__learn-more">
				<ExternalLink href={ __( 'https://wordpress.org/support/article/embeds/' ) }>
					{ __( 'Learn more about embeds' ) }
				</ExternalLink>
			</div>
		</Placeholder>
	);
};

export default EmbedPlaceholder;
