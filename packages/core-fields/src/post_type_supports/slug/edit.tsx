import { Button } from '@wordpress/components';
import { copySmall } from '@wordpress/icons';
import { useCopyToClipboard, useInstanceId } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { InputControl, InputLayout, Link, Stack } from '@wordpress/ui';
import { safeDecodeURIComponent } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { hasActionLink } from '../../shared/has-action-link';
import type { PostWithSlug } from './types';
import { getSlug } from './utils';
import styles from './style.module.css';

const PERMALINK_POSTNAME_REGEX = /%(?:postname|pagename)%/;

/*
 * A copy of the slug control of `@wordpress/fields`, laid out with `Stack`
 * and built with `InputControl`, `InputLayout`, and `Link` from
 * `@wordpress/ui`, as `use-recommended-components` asks, and styled with a
 * CSS module. It keeps the first slug in state rather than in a ref read
 * during render.
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

	const slug = field.getValue( { item: data } ) || getSlug( data );
	const permalinkTemplate = data.permalink_template || '';
	const [ permalinkPrefix, permalinkSuffix ] = permalinkTemplate.split(
		PERMALINK_POSTNAME_REGEX
	);
	// A user who can't publish only gets the permalink.
	const isEditable =
		PERMALINK_POSTNAME_REGEX.test( permalinkTemplate ) &&
		hasActionLink( data, 'wp:action-publish' );
	// The slug the post had first, shown and restored while the slug is
	// emptied.
	const [ originalSlug ] = useState( slug );
	const slugToDisplay = slug || originalSlug;
	const permalink = isEditable
		? `${ permalinkPrefix }${ slugToDisplay }${ permalinkSuffix }`
		: safeDecodeURIComponent( data.link || '' );

	const onChangeControl = useCallback(
		( newValue?: string ) =>
			onChange( {
				[ id ]: newValue,
			} ),
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
						<span>
							{ __(
								'Customize the last part of the Permalink.'
							) }
						</span>
						<Link
							href="https://wordpress.org/documentation/article/page-post-settings-sidebar/#permalink"
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
									icon={ copySmall }
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
						onBlur={ () => {
							if ( slug === '' ) {
								onChangeControl( originalSlug );
							}
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
							<span>{ permalinkPrefix }</span>
							<span className={ styles[ 'help-slug' ] }>
								{ slugToDisplay }
							</span>
							<span>{ permalinkSuffix }</span>
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
