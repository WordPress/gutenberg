import { Autocomplete, Icon, Input, InputLayout } from '@wordpress/ui';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect, useRef, useMemo } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { Modal, TextHighlight } from '@wordpress/components';
import {
	store as keyboardShortcutsStore,
	useShortcut,
} from '@wordpress/keyboard-shortcuts';
import { withIgnoreIMEEvents } from '@wordpress/keycodes';
import { search as inputIcon } from '@wordpress/icons';
import { executeAbility, store as abilitiesStore } from '@wordpress/abilities';
import './workflow-menu.scss';

/**
 * Constants
 */
const EMPTY_ARRAY = [];
const inputLabel = __( 'Run abilities and workflows' );

/**
 * @ignore
 */
export function WorkflowMenu() {
	const { registerShortcut } = useDispatch( keyboardShortcutsStore );
	const [ search, setSearch ] = useState( '' );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ abilityOutput, setAbilityOutput ] = useState( null );
	const [ isExecuting, setIsExecuting ] = useState( false );
	const containerRef = useRef();
	const inputRef = useRef();

	const abilities = useSelect( ( select ) => {
		const allAbilities = select( abilitiesStore ).getAbilities();
		return allAbilities || EMPTY_ARRAY;
	}, [] );

	const filteredAbilities = useMemo( () => {
		if ( ! search ) {
			return abilities;
		}
		const searchLower = search.toLowerCase();
		return abilities.filter(
			( ability ) =>
				ability.label?.toLowerCase().includes( searchLower ) ||
				ability.name?.toLowerCase().includes( searchLower )
		);
	}, [ abilities, search ] );

	// Focus container when output is shown so it can receive keyboard events
	useEffect( () => {
		if ( abilityOutput && containerRef.current ) {
			containerRef.current.focus();
		}
	}, [ abilityOutput ] );

	useEffect( () => {
		if ( isOpen && ! abilityOutput ) {
			inputRef.current?.focus();
		}
	}, [ isOpen, abilityOutput ] );

	useEffect( () => {
		registerShortcut( {
			name: 'core/workflows',
			category: 'global',
			description: __( 'Open the workflow palette.' ),
			keyCombination: {
				modifier: 'primary',
				character: 'j',
			},
		} );
	}, [ registerShortcut ] );

	useShortcut(
		'core/workflows',
		/** @type {React.KeyboardEventHandler} */
		withIgnoreIMEEvents( ( event ) => {
			// Bails to avoid obscuring the effect of the preceding handler(s).
			if ( event.defaultPrevented ) {
				return;
			}

			event.preventDefault();
			setIsOpen( ! isOpen );
		} ),
		{
			bindGlobal: true,
		}
	);

	useEffect( () => {
		if ( isOpen ) {
			// Load @wordpress/core-abilities on demand. Importing it fetches
			// and registers all server abilities and categories.
			import( '@wordpress/core-abilities' );
		}
	}, [ isOpen ] );

	const closeAndReset = () => {
		setSearch( '' );
		setIsOpen( false );
		setAbilityOutput( null );
		setIsExecuting( false );
	};

	const goBack = () => {
		setAbilityOutput( null );
		setIsExecuting( false );
		setSearch( '' );
	};

	const handleExecuteAbility = async ( ability ) => {
		setIsExecuting( true );
		try {
			const result = await executeAbility( ability.name );
			setAbilityOutput( {
				name: ability.name,
				label: ability?.label || ability.name,
				description: ability?.description || '',
				success: true,
				data: result,
			} );
		} catch ( error ) {
			setAbilityOutput( {
				name: ability.name,
				label: ability?.label || ability.name,
				description: ability?.description || '',
				success: false,
				error: error.message || String( error ),
			} );
		} finally {
			setIsExecuting( false );
		}
	};

	const onContainerKeyDown = ( event ) => {
		// Handle going back when viewing output
		if (
			abilityOutput &&
			( event.key === 'Escape' ||
				event.key === 'Backspace' ||
				event.key === 'Delete' )
		) {
			event.preventDefault();
			event.stopPropagation();
			goBack();
		}
	};

	if ( ! isOpen ) {
		return null;
	}

	const items = isExecuting ? EMPTY_ARRAY : filteredAbilities;
	const showEmpty = ! isExecuting && !! search && ! filteredAbilities.length;

	return (
		<Modal
			className="workflows-workflow-menu"
			overlayClassName="workflows-workflow-menu__overlay"
			onRequestClose={ abilityOutput ? goBack : closeAndReset }
			__experimentalHideHeader
			contentLabel={ __( 'Workflow palette' ) }
		>
			<div
				className="workflows-workflow-menu__container"
				onKeyDown={ withIgnoreIMEEvents( onContainerKeyDown ) }
				ref={ containerRef }
				//  Tab index and role are needed here to escape the output mode.
				tabIndex={ -1 }
				role="presentation"
			>
				{ abilityOutput ? (
					<div className="workflows-workflow-menu__output">
						<div className="workflows-workflow-menu__output-header">
							<h3>{ abilityOutput.label }</h3>
							{ abilityOutput.description && (
								<p className="workflows-workflow-menu__output-hint">
									{ abilityOutput.description }
								</p>
							) }
						</div>
						<div className="workflows-workflow-menu__output-content">
							{ abilityOutput.success ? (
								<pre>
									{ JSON.stringify(
										abilityOutput.data,
										null,
										2
									) }
								</pre>
							) : (
								<div className="workflows-workflow-menu__output-error">
									<p>{ abilityOutput.error }</p>
								</div>
							) }
						</div>
					</div>
				) : (
					<Autocomplete.Root
						items={ items }
						mode="none"
						value={ search }
						onValueChange={ setSearch }
						open
						inline
						autoHighlight="always"
					>
						<Autocomplete.Input
							ref={ inputRef }
							placeholder={ inputLabel }
							aria-label={ inputLabel }
							className="workflows-workflow-menu__input"
							render={
								<Input
									prefix={
										<InputLayout.Slot>
											<Icon
												icon={ inputIcon }
												style={
													isRTL()
														? undefined
														: {
																transform:
																	'scaleX(-1)',
														  }
												}
											/>
										</InputLayout.Slot>
									}
								/>
							}
						/>
						<Autocomplete.Status className="workflows-workflow-menu__executing">
							{ isExecuting ? __( 'Executing ability…' ) : null }
						</Autocomplete.Status>
						<Autocomplete.Empty className="workflows-workflow-menu__empty">
							{ showEmpty ? __( 'No results found.' ) : null }
						</Autocomplete.Empty>
						<Autocomplete.List
							className="workflows-workflow-menu__list"
							aria-label={ __( 'Workflow suggestions' ) }
						>
							<Autocomplete.ListBody className="workflows-workflow-menu__list-body">
								<Autocomplete.Collection>
									{ ( item ) => (
										<Autocomplete.Item
											key={ item.name }
											value={ item }
											className="workflows-workflow-menu__item"
											onClick={ () =>
												handleExecuteAbility( item )
											}
										>
											<span className="workflows-workflow-menu__item-label">
												<TextHighlight
													text={ item.label }
													highlight={ search }
												/>
											</span>
										</Autocomplete.Item>
									) }
								</Autocomplete.Collection>
							</Autocomplete.ListBody>
						</Autocomplete.List>
					</Autocomplete.Root>
				) }
			</div>
		</Modal>
	);
}
