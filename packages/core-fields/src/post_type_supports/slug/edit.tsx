import { Button } from '@wordpress/components';
import { copy } from '@wordpress/icons';
import { useCopyToClipboard, useInstanceId } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useCallback, useRef, useState } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { InputControl, InputLayout, Link, Stack } from '@wordpress/ui';
import { cleanForSlug, safeDecodeURIComponent } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { hasActionLink } from '../../shared/has-action-link';
import type { PostWithSlug } from './types';
import styles from './style.module.css';

const PERMALINK_POSTNAME_REGEX = /%(?:postname|pagename)%/;

/*
 * The slug control, laid out with `Stack` and built with `InputControl`, `InputLayout`, and `Link` from
 * `@wordpress/ui`, as `use-recommended-components` asks, and styled with a
 * CSS module.
 */
const SlugEdit = ( {
	field,
	onChange,
	data,
}: {
	field: {
		id: string;
		getValue: ( args: { item: PostWithSlug } ) => string | undefined;
	};
	onChange: ( value: Record< string, string | undefined > ) => void;
	data: PostWithSlug;
} ) => {
	const { id } = field;

	// Decoded, and falls back to the slug derived from the title, as the
	// classic PostURL panel does.
	const value = field.getValue( { item: data } ) ?? '';
	// An empty slug falls back to the one derived from the title, which would
	// refill the field. Keep it empty while the user types.
	const [ forceEmptyField, setForceEmptyField ] = useState( false );
	const slugOnFocusRef = useRef< string | undefined >( undefined );
	const slug = forceEmptyField ? '' : value;
	const permalinkTemplate = data.permalink_template || '';
	const [ permalinkPrefix, permalinkSuffix ] = permalinkTemplate.split(
		PERMALINK_POSTNAME_REGEX
	);
	// A user who can't publish only gets the permalink.
	const isEditable =
		PERMALINK_POSTNAME_REGEX.test( permalinkTemplate ) &&
		hasActionLink( data, 'wp:action-publish' );
	// A post without a slug or a title has no pretty permalink yet, so use its
	// plain one (`?p=ID`).
	const permalink =
		isEditable && slug
			? `${ permalinkPrefix }${ slug }${ permalinkSuffix }`
			: safeDecodeURIComponent( data.link || '' );

	const onChangeControl = useCallback(
		( newValue?: string ) => {
			onChange( {
				[ id ]: newValue,
			} );
			setForceEmptyField( ! newValue );
		},
		[ id, onChange ]
	);

	const { createNotice } = useDispatch( noticesStore );

	const copyButtonRef = useCopyToClipboard( permalink, () => {
		createNotice( 'info', __( 'Copied Permalink to clipboard.' ), {
			isDismissible: true,
			type: 'snackbar',
		} );
	} );

	const postUrlSlugDescriptionId =
		'editor-post-url__slug-description-' + useInstanceId( SlugEdit );

	return (
		<fieldset className={ styles.slug }>
			{ isEditable && (
				<Stack direction="column" gap="sm">
					<Stack direction="column">
						<span id={ postUrlSlugDescriptionId }>
							{ __(
								'Customize the last part of the Permalink.'
							) }
						</span>
						<Link
							href={ __(
								'https://wordpress.org/documentation/article/page-post-settings-sidebar/#permalink'
							) }
							openInNewTab
						>
							{ __( 'Learn more' ) }
						</Link>
					</Stack>
					<InputControl
						prefix={ <InputLayout.Slot>/</InputLayout.Slot> }
						suffix={
							<InputLayout.Slot padding="minimal">
								<Button
									size="small"
									icon={ copy }
									ref={ copyButtonRef }
									label={ __( 'Copy' ) }
								/>
							</InputLayout.Slot>
						}
						label={ __( 'Link' ) }
						hideLabelFromVision
						value={ slug }
						autoComplete="off"
						spellCheck="false"
						type="text"
						onValueChange={ ( newValue ) => {
							onChangeControl( newValue );
						} }
						onFocus={ ( event ) => {
							slugOnFocusRef.current = event.target.value;
						} }
						onBlur={ ( event ) => {
							// Only clean a slug the user changed. An untouched
							// slug came from the server, and cleaning it would
							// strip characters `sanitize_title` kept, such as
							// emoji. Without a slug the field shows the one
							// derived from the title, and saving it would stop
							// the slug from following the title.
							if (
								event.target.value !== slugOnFocusRef.current
							) {
								onChange( {
									[ id ]: cleanForSlug( event.target.value ),
								} );
							}
							setForceEmptyField( false );
						} }
						aria-describedby={ postUrlSlugDescriptionId }
					/>
					<div className={ styles.help }>
						<span>{ __( 'Permalink:' ) }</span>
						<Link
							className={ styles[ 'help-link' ] }
							href={ permalink }
							openInNewTab
						>
							{ slug ? (
								<>
									<span>{ permalinkPrefix }</span>
									<span className={ styles[ 'help-slug' ] }>
										{ slug }
									</span>
									<span>{ permalinkSuffix }</span>
								</>
							) : (
								permalink
							) }
						</Link>
					</div>
				</Stack>
			) }
			{ ! isEditable && (
				<Link
					className={ styles[ 'help-link' ] }
					href={ permalink }
					openInNewTab
				>
					{ permalink }
				</Link>
			) }
		</fieldset>
	);
};

export default SlugEdit;
