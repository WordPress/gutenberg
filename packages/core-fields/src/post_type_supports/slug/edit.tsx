import { Button } from '@wordpress/components';
import { copySmall } from '@wordpress/icons';
import { useCopyToClipboard } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { InputControl, InputLayout, Link } from '@wordpress/ui';
import { safeDecodeURIComponent } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { hasActionLink } from '../../shared/has-action-link';
import type { PostWithSlug } from './types';
import { getSlug } from './utils';
import styles from './style.module.css';

const PERMALINK_POSTNAME_REGEX = /%(?:postname|pagename)%/;

/*
 * The slug control, built with `InputControl`, `InputLayout`, and `Link` from
 * `@wordpress/ui`, as `use-recommended-components` asks, and styled with a
 * CSS module.
 */
const SlugEdit = ( {
	field,
	onChange,
	data,
	hideLabelFromVision,
}: {
	field: {
		id: string;
		getValue: ( args: { item: PostWithSlug } ) => string | undefined;
	};
	onChange: ( value: Record< string, string | undefined > ) => void;
	data: PostWithSlug;
	hideLabelFromVision?: boolean;
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
	// A post without a slug or a title has no pretty permalink yet, so use its
	// plain one (`?p=ID`).
	const permalink =
		isEditable && slug
			? `${ permalinkPrefix }${ slug }${ permalinkSuffix }`
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

	return (
		<fieldset className={ styles.slug }>
			{ isEditable && (
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
					hideLabelFromVision={ hideLabelFromVision }
					value={ slug }
					autoComplete="off"
					spellCheck="false"
					type="text"
					onValueChange={ ( newValue ) => {
						onChangeControl( newValue );
					} }
				/>
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
