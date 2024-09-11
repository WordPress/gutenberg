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
import { useCopyToClipboard } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { safeDecodeURIComponent } from '@wordpress/url';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { SlugItem } from './types';

const SlugEdit = ( {
	field,
	onChange,
	data,
}: DataFormControlProps< SlugItem > ) => {
	const { id } = field;

	const slug = field.getValue( { item: data } ) ?? '';
	const permalinkTemplate = data.permalink_template || '';
	const PERMALINK_POSTNAME_REGEX = /%(?:postname|pagename)%/;
	const [ prefix, suffix ] = permalinkTemplate.split(
		PERMALINK_POSTNAME_REGEX
	);
	const permalinkPrefix = prefix;
	const permalinkSuffix = suffix;
	const isEditable = PERMALINK_POSTNAME_REGEX.test( permalinkTemplate );
	const originalSlug = useRef( slug );
	const slugToDisplay = slug || originalSlug.current;
	const permalink = isEditable
		? `${ permalinkPrefix }${ slugToDisplay }${ permalinkSuffix }`
		: safeDecodeURIComponent( data.link || '' );

	useEffect( () => {
		if ( slug && originalSlug.current === undefined ) {
			originalSlug.current = slug;
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
		createNotice( 'info', __( 'Copied URL to clipboard.' ), {
			isDismissible: true,
			type: 'snackbar',
		} );
	} );

	return (
		<fieldset className="edit-site-dataviews-controls__slug">
			{ isEditable && (
				<VStack>
					<VStack spacing="0px">
						<span>
							{ __( 'Customize the last part of the URL.' ) }
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
						className="edit-site-dataviews-controls__slug-input"
						onChange={ ( newValue?: string ) => {
							onChangeControl( newValue );
						} }
						onBlur={ () => {
							if ( slug === '' ) {
								onChangeControl( originalSlug.current );
							}
						} }
						help={
							<ExternalLink
								className="edit-site-dataviews-controls__slug-help"
								href={ permalink }
							>
								<span>{ permalinkPrefix }</span>
								<span className="edit-site-dataviews-controls__slug-help-slug">
									{ slugToDisplay }
								</span>
								<span className="edit-site-dataviews-controls__slug-help-suffix">
									{ permalinkSuffix }
								</span>
							</ExternalLink>
						}
					/>
				</VStack>
			) }
			{ ! isEditable && (
				<ExternalLink
					className="edit-site-dataviews-controls__slug-help"
					href={ permalink }
				>
					{ permalink }
				</ExternalLink>
			) }
		</fieldset>
	);
};

export default SlugEdit;
