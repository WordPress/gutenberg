/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Button, Placeholder } from '@wordpress/components';
import { BlockIcon } from '@wordpress/editor';

const EmbedPlaceholder = ( props ) => {
	const { icon, label, value, onSubmit, onChange, cannotEmbed, fallback, tryAgain } = props;
	return (
		<Placeholder icon={ <BlockIcon icon={ icon } showColors /> } label={ label } className="wp-block-embed">
			<form onSubmit={ onSubmit }>
				<input
					type="url"
					value={ value || '' }
					className="components-placeholder__input"
					aria-label={ label }
					placeholder={ __( 'Enter URL to embed here…' ) }
					onChange={ onChange } />
				<Button
					isLarge
					type="submit">
					{ _x( 'Embed', 'button label' ) }
				</Button>
				{ cannotEmbed &&
					<p className="components-placeholder__error">
						{ __( 'Sorry, this content could not be embedded.' ) }<br />
						<Button isLarge onClick={ tryAgain }>{ _x( 'Try again', 'button label' ) }</Button> <Button isLarge onClick={ fallback }>{ _x( 'Convert to link', 'button label' ) }</Button>
					</p>
				}
			</form>
		</Placeholder>
	);
};

export default EmbedPlaceholder;
