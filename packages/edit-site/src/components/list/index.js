/**
 * WordPress dependencies
 */
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { InterfaceSkeleton } from '@wordpress/interface';
import { __, sprintf } from '@wordpress/i18n';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { EditorSnackbars } from '@wordpress/editor';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useRegisterShortcuts from './use-register-shortcuts';
import Header from './header';
import Table from './table';
import { useLocation } from '../routes';
import useTitle from '../routes/use-title';

export default function List() {
	const {
		params: { postType: templateType },
	} = useLocation();

	useRegisterShortcuts();

	const { previousShortcut, nextShortcut } = useSelect( ( select ) => {
		return {
			previousShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutKeyCombinations( 'core/edit-site/previous-region' ),
			nextShortcut: select(
				keyboardShortcutsStore
			).getAllShortcutKeyCombinations( 'core/edit-site/next-region' ),
		};
	}, [] );

	const postType = useSelect(
		( select ) => select( coreStore ).getPostType( templateType ),
		[ templateType ]
	);

	useTitle( postType?.labels?.name );

	// `postType` could load in asynchronously. Only provide the detailed region labels if
	// the postType has loaded, otherwise `InterfaceSkeleton` will fallback to the defaults.
	const itemsListLabel = postType?.labels?.items_list;
	const detailedRegionLabels = postType
		? {
				header: sprintf(
					// translators: %s - the name of the page, 'Header' as in the header area of that page.
					__( '%s - Header' ),
					itemsListLabel
				),
				body: sprintf(
					// translators: %s - the name of the page, 'Content' as in the content area of that page.
					__( '%s - Content' ),
					itemsListLabel
				),
		  }
		: undefined;

	const {
		records: templates,
		isResolving,
		hasResolved,
	} = useEntityRecords( 'postType', templateType, {
		per_page: -1,
	} );

	const { customizedTemplates, nonCustomizedTemplates } = useMemo( () => {
		let mappedTemplates = {
			customizedTemplates: [],
			nonCustomizedTemplates: [],
		};

		if ( ! hasResolved || ! templates ) {
			return [];
		}

		if ( templates.length ) {
			mappedTemplates = templates.reduce(
				( accumulator, template ) => {
					if ( template.source === 'custom' ) {
						accumulator.customizedTemplates.push( template );
					} else {
						accumulator.nonCustomizedTemplates.push( template );
					}
					return accumulator;
				},
				{ customizedTemplates: [], nonCustomizedTemplates: [] }
			);
		}

		return mappedTemplates;
	}, [ templates ] );

	return (
		<InterfaceSkeleton
			className="edit-site-list"
			labels={ detailedRegionLabels }
			header={ <Header templateType={ templateType } /> }
			notices={ <EditorSnackbars /> }
			content={
				<>
					<Table
						templateType={ templateType }
						templates={ customizedTemplates }
						isLoading={ isResolving }
						label={ __( 'Customized templates' ) }
						showActionsColumn
					/>
					<Table
						templateType={ templateType }
						templates={ nonCustomizedTemplates }
						isLoading={ isResolving }
						label={ __( 'Other templates' ) }
					/>
				</>
			}
			shortcuts={ {
				previous: previousShortcut,
				next: nextShortcut,
			} }
		/>
	);
}
