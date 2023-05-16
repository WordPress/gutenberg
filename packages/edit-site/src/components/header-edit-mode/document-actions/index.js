/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import {
	__experimentalGetBlockLabel as getBlockLabel,
	getBlockType,
} from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	VisuallyHidden,
	Icon,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	Path,
	SVG,
} from '@wordpress/components';
import { layout, page, symbol, chevronLeftSmall } from '@wordpress/icons';
import {
	store as blockEditorStore,
	useBlockDisplayInformation,
} from '@wordpress/block-editor';
import { privateApis as commandsPrivateApis } from '@wordpress/commands';

/**
 * Internal dependencies
 */
import useEditedEntityRecord from '../../use-edited-entity-record';
import { unlock } from '../../../private-apis';

const { store: commandsStore } = unlock( commandsPrivateApis );

function getBlockDisplayText( block ) {
	if ( block ) {
		const blockType = getBlockType( block.name );
		return blockType ? getBlockLabel( blockType, block.attributes ) : null;
	}
	return null;
}

function useSecondaryText() {
	const { getBlock } = useSelect( blockEditorStore );
	const activeEntityBlockId = useSelect(
		( select ) =>
			select(
				blockEditorStore
			).__experimentalGetActiveBlockIdByBlockNames( [
				'core/template-part',
			] ),
		[]
	);

	const blockInformation = useBlockDisplayInformation( activeEntityBlockId );

	if ( activeEntityBlockId ) {
		return {
			label: getBlockDisplayText( getBlock( activeEntityBlockId ) ),
			isActive: true,
			icon: blockInformation?.icon,
		};
	}

	return {};
}

const titleIcon = {
	page,
	wp_template: layout,
	wp_template_part: symbol,
};

export default function DocumentActions( {
	showBack = false,
	onBack,
	backLabel = __( 'Back' ),
} ) {
	const { isLoaded, record, getTitle } = useEditedEntityRecord();
	const { label } = useSecondaryText();
	const { open: openCommand } = useDispatch( commandsStore );

	// Return a simple loading indicator until we have information to show.
	if ( ! isLoaded ) {
		return (
			<div className="edit-site-document-actions">
				<Text
					size="body"
					className="edit-site-document-actions__title-wrapper"
				>
					{ __( 'Loading…' ) }
				</Text>
			</div>
		);
	}

	// Return feedback that the template does not seem to exist.
	if ( ! record ) {
		return (
			<div className="edit-site-document-actions">
				{ __( 'Template not found' ) }
			</div>
		);
	}

	const entityLabel =
		record.type === 'wp_template_part'
			? __( 'template part' )
			: __( 'template' );

	const handleBack = ( e ) => {
		e.stopPropagation();
		onBack();
	};
	return (
		<div
			className={ classnames( 'edit-site-document-actions', {
				'has-secondary-label': !! label,
			} ) }
			role="button"
			tabIndex={ 0 }
			onClick={ openCommand }
			onKeyDown={ openCommand }
		>
			{ showBack && (
				<HStack alignment="left">
					<Button
						className="edit-site-document-actions__back"
						onClick={ handleBack }
						icon={ chevronLeftSmall }
					>
						{ backLabel }
					</Button>
				</HStack>
			) }
			<HStack
				spacing={ 2 }
				className={ classnames(
					'edit-site-document-actions__title-wrapper',
					{
						'is-global': !! record.type !== 'page',
					}
				) }
			>
				<Icon icon={ titleIcon[ record.type ] } />
				<Text
					size="body"
					className="edit-site-document-actions__title"
					as="h1"
				>
					<VisuallyHidden as="span">
						{ sprintf(
							/* translators: %s: the entity being edited, like "template"*/
							__( 'Editing %s: ' ),
							entityLabel
						) }
					</VisuallyHidden>
					{ getTitle() }
				</Text>
			</HStack>
			<HStack
				spacing={ 1 }
				alignment="right"
				className="edit-site-document-actions__shortcut"
			>
				<Icon
					icon={
						<SVG
							width="24px"
							height="24px"
							viewBox="0 0 24 24"
							strokeWidth="1.5"
							fill="none"
							xmlns="http://www.w3.org/2000/SVG"
							color="currentColor"
						>
							<Path
								d="M9 6v12M15 6v12M9 6a3 3 0 10-3 3h12a3 3 0 10-3-3M9 18a3 3 0 11-3-3h12a3 3 0 11-3 3"
								stroke="currentColor"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							></Path>
						</SVG>
					}
					size={ 16 }
				/>
				<Text>K</Text>
			</HStack>
		</div>
	);
}
