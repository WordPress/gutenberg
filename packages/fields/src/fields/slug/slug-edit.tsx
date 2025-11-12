/**
 * WordPress dependencies
 */
import {
	Button,
	ExternalLink,
	__experimentalInputControl as InputControl,
	__experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { copySmall } from '@wordpress/icons';
import { useCopyToClipboard, useInstanceId } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { safeDecodeURIComponent } from '@wordpress/url';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import { getSlug } from './utils';

const SlugEdit = ( {
	field,
	onChange,
	data,
}: DataFormControlProps< BasePost > ) => {
	const { id } = field;

	const slug = field.getValue( { item: data } ) || getSlug( data );
	const permalinkTemplate = data.permalink_template || '';
	const PERMALINK_POSTNAME_REGEX = /%(?:postname|pagename)%/;
	const [ prefix, suffix ] = permalinkTemplate.split(
		PERMALINK_POSTNAME_REGEX
	);
	const permalinkPrefix = prefix;
	const permalinkSuffix = suffix;
	const isEditable = PERMALINK_POSTNAME_REGEX.test( permalinkTemplate );
	const originalSlugRef = useRef( slug );
	const slugToDisplay = slug || originalSlugRef.current;
	const permalink = isEditable
		? `${ permalinkPrefix }${ slugToDisplay }${ permalinkSuffix }`
		: safeDecodeURIComponent( data.link || '' );

	useEffect( () => {
		if ( slug && originalSlugRef.current === undefined ) {
			originalSlugRef.current = slug;
		}
	}, [ slug ] );

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
		<fieldset className="fields-controls__slug">
			{ isEditable && (
				<VStack>
					<VStack spacing="0px">
						<span>
							{ __(
								'Customize the last part of the Permalink.'
							) }
						</span>
						<ExternalLink href="https://wordpress.org/documentation/article/page-post-settings-sidebar/#permalink">
							{ __( 'Learn more' ) }
						</ExternalLink>
					</VStack>
					<InputControl
						__next40pxDefaultSize
						prefix={
							<InputControlPrefixWrapper>
								/
							</InputControlPrefixWrapper>
						}
						suffix={
							<Button
								__next40pxDefaultSize
								icon={ copySmall }
								ref={ copyButtonRef }
								label={ __( 'Copy' ) }
							/>
						}
						label={ __( 'Link' ) }
						hideLabelFromVision
						value={ slug }
						autoComplete="off"
						spellCheck="false"
						type="text"
						className="fields-controls__slug-input"
						onChange={ ( newValue?: string ) => {
							onChangeControl( newValue );
						} }
						onBlur={ () => {
							if ( slug === '' ) {
								onChangeControl( originalSlugRef.current );
							}
						} }
						aria-describedby={ postUrlSlugDescriptionId }
					/>
					<div className="fields-controls__slug-help">
						<span className="fields-controls__slug-help-visual-label">
							{ __( 'Permalink:' ) }
						</span>
						<ExternalLink
							className="fields-controls__slug-help-link"
							href={ permalink }
						>
							<span className="fields-controls__slug-help-prefix">
								{ permalinkPrefix }
							</span>
							<span className="fields-controls__slug-help-slug">
								{ slugToDisplay }
							</span>
							<span className="fields-controls__slug-help-suffix">
								{ permalinkSuffix }
							</span>
						</ExternalLink>
					</div>
				</VStack>
			) }
			{ ! isEditable && (
				<ExternalLink
					className="fields-controls__slug-help"
					href={ permalink }
				>
					{ permalink }
				</ExternalLink>
			) }
		</fieldset>
	);
};

export default SlugEdit;
