/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useMemo } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { cleanForSlug } from '@wordpress/url';
import {
	Placeholder,
	TextControl,
	Button,
	TabPanel,
} from '@wordpress/components';
import { layout } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useTemplatePartPost from '../use-template-part-post';
import TemplatePartPreviews from './template-part-previews';

const HELP_PHRASES = {
	initial: __( 'Please add a name and theme for your new Template Part.' ),
	unavailable: __(
		'Name and theme combination already in use, please try another.'
	),
	available: __( 'This name is available!' ),
	error: __( 'Error adding template.' ),
};

export default function TemplatePartPlaceholder( { setAttributes } ) {
	const [ slug, _setSlug ] = useState( '' );
	const [ theme, _setTheme ] = useState( '' );
	const [ help, setHelp ] = useState( '' );

	// Try to find an existing template part.
	const postId = useTemplatePartPost( null, slug, theme );

	const setSlug = useCallback(
		( nextSlug ) => {
			_setSlug( nextSlug );
			if ( help ) {
				setHelp( '' );
			}
		},
		[ help ]
	);

	const setTheme = useCallback(
		( nextTheme ) => {
			_setTheme( nextTheme );
			if ( help ) {
				setHelp( '' );
			}
		},
		[ help ]
	);

	const helpPhrase = useMemo( () => {
		if ( ! slug || ! theme ) {
			return HELP_PHRASES.initial;
		} else if ( postId ) {
			return HELP_PHRASES.unavailable;
		}

		return HELP_PHRASES.available;
	}, [ slug, theme, postId ] );

	const { saveEntityRecord } = useDispatch( 'core' );
	const onCreate = useCallback( async () => {
		const nextAttributes = { slug, theme };
		// Create a new template part.
		try {
			const cleanSlug = cleanForSlug( slug );
			const templatePart = await saveEntityRecord(
				'postType',
				'wp_template_part',
				{
					title: cleanSlug,
					status: 'publish',
					slug: cleanSlug,
					meta: { theme },
				}
			);
			nextAttributes.postId = templatePart.id;
		} catch ( err ) {
			setHelp( HELP_PHRASES.error );
		}
		setAttributes( nextAttributes );
	}, [ postId, slug, theme ] );

	const [ filterValue, setFilterValue ] = useState( '' );

	const createTab = (
		<>
			<div className="wp-block-template-part__placeholder-input-container">
				<TextControl
					label={ __( 'Name' ) }
					placeholder={ __( 'header' ) }
					value={ slug }
					onChange={ setSlug }
					className="wp-block-template-part__placeholder-input"
				/>
				<TextControl
					label={ __( 'Theme' ) }
					placeholder={ __( 'twentytwenty' ) }
					value={ theme }
					onChange={ setTheme }
					className="wp-block-template-part__placeholder-input"
				/>
			</div>
			<div className="wp-block-template-part__placeholder-help-phrase">
				{ help || helpPhrase }
			</div>
			<Button
				isPrimary
				disabled={ ! slug || ! theme || postId }
				onClick={ onCreate }
				className="wp-block-template-part__placeholder-create-button"
			>
				{ __( 'Create' ) }
			</Button>
		</>
	);

	const selectTab = (
		<>
			<TextControl
				label={ __( 'Search' ) }
				placeholder={ __( 'header' ) }
				value={ filterValue }
				onChange={ setFilterValue }
				className="wp-block-template-part__placeholder-preview-filter-input"
			/>

			<div className="wp-block-template-part__placeholder-preview-container">
				<TemplatePartPreviews
					setAttributes={ setAttributes }
					filterValue={ filterValue }
				/>
			</div>
		</>
	);

	return (
		<Placeholder icon={ layout } label={ __( 'Template Part' ) }>
			<TabPanel
				className="wp-block-template-part__placeholder-tabs"
				tabs={ [
					{
						name: 'select',
						/* translators: Select tab of template part creation placeholder. */
						title: __( 'Select from existing' ),
					},
					{
						name: 'create',
						/* translators: Create tab of template part placeholder.  */
						title: __( 'Create new' ),
					},
				] }
			>
				{ ( tab ) => {
					if ( tab.name === 'create' ) {
						return createTab;
					}
					return selectTab;
				} }
			</TabPanel>
		</Placeholder>
	);
}
