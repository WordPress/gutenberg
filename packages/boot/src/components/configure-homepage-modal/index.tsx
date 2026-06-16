/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	Notice,
	RadioControl,
	SelectControl,
} from '@wordpress/components';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { Text } from '@wordpress/ui';

const READING_DISPLAY_LATEST = 'posts';
const READING_DISPLAY_STATIC = 'page';
const HOME_PAGE_TITLE_SLUGS = [ 'home', 'homepage', 'frontpage' ];

interface ConfigureHomepageModalProps {
	onClose: () => void;
	onSaved: () => void;
}

interface PageRecord {
	id: number;
	title?: {
		rendered?: string;
		raw?: string;
	};
}

interface SiteSettings {
	show_on_front?: string;
	page_on_front?: number;
	page_for_posts?: number;
}

function getPlainTextTitle( title?: string ) {
	if ( ! title ) {
		return '';
	}

	return decodeEntities( title.replace( /<[^>]+>/g, '' ) ).trim();
}

function getPageTitle( page: PageRecord ) {
	return (
		getPlainTextTitle( page.title?.rendered || page.title?.raw ) ||
		__( '(no title)' )
	);
}

function isHomeEquivalentTitle( title: string ) {
	const normalizedTitle = title
		.toLocaleLowerCase()
		.replace( /[^a-z0-9]+/g, '' );

	return HOME_PAGE_TITLE_SLUGS.includes( normalizedTitle );
}

function getSuggestedHomePageId( pages: PageRecord[] ) {
	return (
		pages
			.find( ( page ) => isHomeEquivalentTitle( getPageTitle( page ) ) )
			?.id.toString() || ''
	);
}

function getSelectOptions(
	pages: PageRecord[],
	selectedId: string,
	excludedId?: string
) {
	const options = [
		{
			label: __( '-- Select --' ),
			value: '',
		},
		...pages
			.filter( ( page ) => page.id.toString() !== excludedId )
			.map( ( page ) => ( {
				label: getPageTitle( page ),
				value: page.id.toString(),
			} ) ),
	];

	if (
		selectedId &&
		! options.some( ( option ) => option.value === selectedId )
	) {
		options.push( {
			label: sprintf(
				/* translators: %s: unavailable page ID. */
				__( 'Unavailable (%s)' ),
				selectedId
			),
			value: selectedId,
		} );
	}

	return options;
}

function getErrorMessage( error: unknown ) {
	return error instanceof Error ? error.message : undefined;
}

export default function ConfigureHomepageModal( {
	onClose,
	onSaved,
}: ConfigureHomepageModalProps ) {
	const { siteSettings } = useSelect( ( select ) => {
		const store = select( coreStore );
		return {
			siteSettings: store.getEntityRecord(
				'root',
				'site'
			) as SiteSettings,
		};
	}, [] );
	const { records: pages } = useEntityRecords( 'postType', 'page', {
		per_page: 100,
		status: 'publish',
		orderby: 'menu_order',
		order: 'asc',
	} );
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const [ mode, setMode ] = useState(
		siteSettings?.show_on_front || READING_DISPLAY_LATEST
	);
	const [ homePageId, setHomePageId ] = useState(
		siteSettings?.page_on_front?.toString() || ''
	);
	const [ postsPageId, setPostsPageId ] = useState(
		siteSettings?.page_for_posts?.toString() || ''
	);
	const [ hasSelectedHomepage, setHasSelectedHomepage ] = useState( false );
	const [ validationError, setValidationError ] = useState< string >();
	const [ isSaving, setIsSaving ] = useState( false );

	useEffect( () => {
		if ( ! siteSettings ) {
			return;
		}

		setMode( siteSettings.show_on_front || READING_DISPLAY_LATEST );
		setHomePageId( siteSettings.page_on_front?.toString() || '' );
		setPostsPageId( siteSettings.page_for_posts?.toString() || '' );
		setHasSelectedHomepage( false );
	}, [ siteSettings ] );

	const pageRecords = useMemo(
		() => ( Array.isArray( pages ) ? ( pages as PageRecord[] ) : [] ),
		[ pages ]
	);
	const suggestedHomePageId = useMemo(
		() => getSuggestedHomePageId( pageRecords ),
		[ pageRecords ]
	);
	const homepageOptions = useMemo(
		() => getSelectOptions( pageRecords, homePageId ),
		[ homePageId, pageRecords ]
	);
	const postsPageOptions = useMemo(
		() => getSelectOptions( pageRecords, postsPageId, homePageId ),
		[ homePageId, pageRecords, postsPageId ]
	);

	useEffect( () => {
		if (
			mode !== READING_DISPLAY_STATIC ||
			homePageId ||
			hasSelectedHomepage ||
			! suggestedHomePageId
		) {
			return;
		}

		setHomePageId( suggestedHomePageId );
		if ( suggestedHomePageId === postsPageId ) {
			setPostsPageId( '' );
		}
	}, [
		hasSelectedHomepage,
		homePageId,
		mode,
		postsPageId,
		suggestedHomePageId,
	] );

	const handleDisplayModeChange = ( nextMode: string ) => {
		setMode( nextMode );
		setValidationError( undefined );
		setHasSelectedHomepage( false );

		if ( nextMode === READING_DISPLAY_LATEST ) {
			setHomePageId( '' );
			setPostsPageId( '' );
			return;
		}

		if ( ! homePageId ) {
			setHomePageId( suggestedHomePageId );
			if ( suggestedHomePageId === postsPageId ) {
				setPostsPageId( '' );
			}
		}
	};

	const handleHomepageSelect = ( nextHomePageId: string ) => {
		setHomePageId( nextHomePageId );
		setHasSelectedHomepage( true );
		setValidationError( undefined );

		if ( nextHomePageId === postsPageId ) {
			setPostsPageId( '' );
		}
	};

	const saveSettings = async () => {
		if ( mode === READING_DISPLAY_STATIC && ! homePageId ) {
			setValidationError(
				__(
					"Choose the page visitors should see at your site's main address."
				)
			);
			return;
		}

		try {
			setIsSaving( true );
			await saveEntityRecord(
				'root',
				'site',
				mode === READING_DISPLAY_LATEST
					? {
							show_on_front: READING_DISPLAY_LATEST,
							page_on_front: 0,
							page_for_posts: 0,
					  }
					: {
							show_on_front: READING_DISPLAY_STATIC,
							page_on_front: Number( homePageId ),
							page_for_posts: postsPageId
								? Number( postsPageId )
								: 0,
					  },
				{ throwOnError: true }
			);

			createSuccessNotice( __( 'Homepage settings updated.' ), {
				type: 'snackbar',
			} );
			onSaved();
			setIsSaving( false );
			onClose();
		} catch ( error ) {
			setIsSaving( false );
			createErrorNotice(
				getErrorMessage( error ) ||
					__( 'The homepage settings could not be updated.' ),
				{ type: 'snackbar' }
			);
		}
	};

	const postsPageHelp =
		mode === READING_DISPLAY_STATIC
			? __(
					'Optional. The Page you pick here sets the URL for your latest posts. Its own content is not shown; WordPress displays posts there using your Blog Home template.'
			  )
			: undefined;

	return (
		<Modal
			className="configure-homepage-modal"
			title={ __( 'Configure site homepage' ) }
			onRequestClose={ onClose }
			size="medium"
		>
			<div className="configure-homepage-modal__body">
				<Text className="configure-homepage-modal__intro">
					{ __(
						"Controls what visitors see at your site's main address."
					) }
				</Text>
				<RadioControl
					label={ __( 'Your homepage displays' ) }
					selected={ mode }
					options={ [
						{
							label: __( 'Your latest posts' ),
							value: READING_DISPLAY_LATEST,
							description: __(
								'Visitors see a list of your Posts. This works well for a blog-style site.'
							),
						},
						{
							label: __( 'Your chosen content Page' ),
							value: READING_DISPLAY_STATIC,
							description: __(
								'Visitors land on one page you create and manage. You can choose that page below.'
							),
						},
					] }
					onChange={ handleDisplayModeChange }
				/>
				{ mode === READING_DISPLAY_STATIC && (
					<div className="configure-homepage-modal__static-fields">
						<SelectControl
							label={ __( 'Homepage' ) }
							value={ homePageId }
							options={ homepageOptions }
							onChange={ handleHomepageSelect }
							__next40pxDefaultSize
						/>
						<SelectControl
							label={ __( 'Posts page' ) }
							value={ postsPageId }
							options={ postsPageOptions }
							help={ postsPageHelp }
							onChange={ ( value ) => {
								setPostsPageId( value || '' );
								setValidationError( undefined );
							} }
							__next40pxDefaultSize
						/>
					</div>
				) }
				{ validationError && (
					<Notice status="warning" isDismissible={ false }>
						{ validationError }
					</Notice>
				) }
			</div>
			<div className="configure-homepage-modal__footer">
				<Button
					variant="tertiary"
					onClick={ onClose }
					disabled={ isSaving }
					accessibleWhenDisabled
					__next40pxDefaultSize
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					variant="primary"
					onClick={ saveSettings }
					disabled={ isSaving }
					accessibleWhenDisabled
					aria-busy={ isSaving }
					__next40pxDefaultSize
				>
					{ __( 'Done' ) }
				</Button>
			</div>
		</Modal>
	);
}
