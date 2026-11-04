import { speak } from '@wordpress/a11y';
import { check, copy, error } from '@wordpress/icons';
import { useCopyToClipboard } from '@wordpress/compose';
import { useCallback, useEffect, useState } from '@wordpress/element';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- The Copy to Clipboard pattern specifies IconButton.
	IconButton,
	InputControl,
	InputLayout,
	Link,
} from '@wordpress/ui';
import { safeDecodeURIComponent } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { hasActionLink } from '../../shared/has-action-link';
import type { PostWithSlug } from './types';
import { getSlug } from './utils';
import styles from './style.module.css';

const PERMALINK_POSTNAME_REGEX = /%(?:postname|pagename)%/;

const COPY_FEEDBACK_TIMEOUT = 2000;

const COPY_RESULT_ICON = {
	idle: copy,
	copied: check,
	error,
};

type CopyResult = keyof typeof COPY_RESULT_ICON;

/*
 * The slug control, built with `IconButton`, `InputControl`, `InputLayout`,
 * and `Link` from
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

	const [ copyFeedback, setCopyFeedback ] = useState< {
		result: CopyResult;
	} >( { result: 'idle' } );

	useEffect( () => {
		if ( copyFeedback.result === 'idle' ) {
			return;
		}
		const timeoutId = setTimeout(
			() => setCopyFeedback( { result: 'idle' } ),
			COPY_FEEDBACK_TIMEOUT
		);
		return () => clearTimeout( timeoutId );
	}, [ copyFeedback ] );

	const copyButtonRef = useCopyToClipboard(
		permalink,
		() => {
			// A new feedback object restarts the timeout for repeated copies.
			setCopyFeedback( { result: 'copied' } );
			speak( __( 'Copied to clipboard' ) );
		},
		() => {
			setCopyFeedback( { result: 'error' } );
			speak( __( "Couldn't copy to clipboard." ) );
		}
	);

	return (
		<fieldset className={ styles.slug }>
			{ isEditable && (
				<InputControl
					prefix={ <InputLayout.Slot>/</InputLayout.Slot> }
					suffix={
						<InputLayout.Slot padding="minimal">
							<IconButton
								ref={ copyButtonRef }
								label={ __( 'Copy' ) }
								icon={ COPY_RESULT_ICON[ copyFeedback.result ] }
								variant="minimal"
								tone="neutral"
								size="compact"
							/>
						</InputLayout.Slot>
					}
					label={ __( 'Link' ) }
					hideLabelFromVision={ hideLabelFromVision }
					details={ permalink }
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
