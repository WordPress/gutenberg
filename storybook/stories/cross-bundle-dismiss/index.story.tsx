/**
 * Cross-bundle overlay dismiss stress test — Storybook stories.
 *
 * These stories mix components from two independent @base-ui/react bundles
 * to verify dismiss coordination across separate React context instances.
 *
 * "Bundle A" = @wordpress/ui (the normal Storybook-resolved copy)
 * "Bundle B" = pre-built ESM with its own inlined @base-ui/react
 *
 * The ESM bundles must be built before running these stories:
 *   node packages/e2e-tests/plugins/overlay-dismiss-stress-test/build-bundles.mjs
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from '@wordpress/element';
import { Dialog as WPDialog, Select as WPSelect } from '@wordpress/ui';
import { Modal, Popover as LegacyPopover } from '@wordpress/components';
// Vite aliases resolve these to pre-built ESM bundles (see storybook/main.ts).
// Each bundle has its own copy of @base-ui/react with independent React contexts.
import * as BundleA from '@cross-bundle-test/bundle-a';
import * as BundleB from '@cross-bundle-test/bundle-b';

const meta: Meta = {
	title: 'Cross-Bundle Dismiss',
};
export default meta;

type Story = StoryObj;

const popupStyle: React.CSSProperties = {
	background: '#fff',
	border: '1px solid #ccc',
	borderRadius: '8px',
	padding: '16px',
	boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
};

const selectTriggerStyle: React.CSSProperties = {
	padding: '6px 12px',
	border: '1px solid #ccc',
	borderRadius: '4px',
	background: '#fff',
	cursor: 'pointer',
	minWidth: '150px',
};

const selectPopupStyle: React.CSSProperties = {
	background: '#fff',
	border: '1px solid #ccc',
	borderRadius: '6px',
	padding: '4px',
	boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};

const selectItemStyle: React.CSSProperties = {
	padding: '6px 12px',
	borderRadius: '4px',
	cursor: 'pointer',
};

function StatusBadge( { label, isOpen }: { label: string; isOpen: boolean } ) {
	return (
		<span
			style={ {
				display: 'inline-flex',
				alignItems: 'center',
				gap: '4px',
				fontSize: '12px',
				padding: '2px 8px',
				borderRadius: '4px',
				background: isOpen ? '#d4edda' : '#f8f9fa',
				border: `1px solid ${ isOpen ? '#28a745' : '#dee2e6' }`,
			} }
		>
			<span
				style={ {
					width: '8px',
					height: '8px',
					borderRadius: '50%',
					background: isOpen ? '#28a745' : '#ccc',
				} }
			/>
			{ label }: { isOpen ? 'Open' : 'Closed' }
		</span>
	);
}

function SelectItems( { lib }: { lib: typeof BundleA } ) {
	return (
		<>
			{ [ 'Apple', 'Banana', 'Cherry', 'Date', 'Elderberry' ].map(
				( fruit ) => (
					<lib.Select.Item
						key={ fruit }
						value={ fruit }
						style={ selectItemStyle }
					>
						<lib.Select.ItemText>{ fruit }</lib.Select.ItemText>
					</lib.Select.Item>
				)
			) }
		</>
	);
}

/**
 * Concern 1.1: WPDS Dialog (Bundle A) + Base UI Select (Bundle B).
 * Click the Select popup — Dialog should stay open.
 */
export const CrossBundleDialogSelect: Story = {
	name: '1.1 Dialog(A) + Select(B)',
	render: () => {
		const [ dialogOpen, setDialogOpen ] = useState( false );
		return (
			<div>
				<div
					style={ {
						display: 'flex',
						gap: '8px',
						marginBottom: '12px',
					} }
				>
					<StatusBadge label="Dialog(A)" isOpen={ dialogOpen } />
				</div>
				<WPDialog.Root
					open={ dialogOpen }
					onOpenChange={ setDialogOpen }
				>
					<WPDialog.Trigger>
						Open WPDS Dialog (Bundle A)
					</WPDialog.Trigger>
					<WPDialog.Popup>
						<WPDialog.Header>
							<WPDialog.Title>
								WPDS Dialog (Bundle A)
							</WPDialog.Title>
						</WPDialog.Header>
						<p>
							Select below is from <strong>Bundle B</strong> (raw
							Base UI):
						</p>
						<BundleB.Select.Root defaultValue="Apple">
							<BundleB.Select.Trigger
								style={ selectTriggerStyle }
							/>
							<BundleB.Select.Portal>
								<BundleB.Select.Positioner>
									<BundleB.Select.Popup
										style={ selectPopupStyle }
									>
										<SelectItems lib={ BundleB } />
									</BundleB.Select.Popup>
								</BundleB.Select.Positioner>
							</BundleB.Select.Portal>
						</BundleB.Select.Root>
					</WPDialog.Popup>
				</WPDialog.Root>
			</div>
		);
	},
};

/**
 * Concern 1.2: Base UI Dialog (Bundle B) + WPDS Select (Bundle A).
 */
export const CrossBundleReversed: Story = {
	name: '1.2 Dialog(B) + Select(A)',
	render: () => {
		const [ dialogOpen, setDialogOpen ] = useState( false );
		return (
			<div>
				<div
					style={ {
						display: 'flex',
						gap: '8px',
						marginBottom: '12px',
					} }
				>
					<StatusBadge label="Dialog(B)" isOpen={ dialogOpen } />
				</div>
				<BundleB.Dialog.Root
					open={ dialogOpen }
					onOpenChange={ setDialogOpen }
				>
					<BundleB.Dialog.Trigger style={ { padding: '8px 16px' } }>
						Open Base UI Dialog (Bundle B)
					</BundleB.Dialog.Trigger>
					<BundleB.Dialog.Portal>
						<BundleB.Dialog.Backdrop
							style={ {
								position: 'fixed',
								inset: 0,
								background: 'rgba(0,0,0,0.3)',
							} }
						/>
						<BundleB.Dialog.Popup
							style={ {
								...popupStyle,
								position: 'fixed',
								top: '50%',
								left: '50%',
								transform: 'translate(-50%, -50%)',
								minWidth: '350px',
							} }
						>
							<h4 style={ { margin: '0 0 12px' } }>
								Base UI Dialog (Bundle B)
							</h4>
							<p>
								Select below is from <strong>Bundle A</strong>{ ' ' }
								(WPDS):
							</p>
							<WPSelect.Root defaultValue="Apple">
								<WPSelect.Trigger />
								<WPSelect.Popup>
									{ [
										'Apple',
										'Banana',
										'Cherry',
										'Date',
										'Elderberry',
									].map( ( fruit ) => (
										<WPSelect.Item
											key={ fruit }
											value={ fruit }
										/>
									) ) }
								</WPSelect.Popup>
							</WPSelect.Root>
						</BundleB.Dialog.Popup>
					</BundleB.Dialog.Portal>
				</BundleB.Dialog.Root>
			</div>
		);
	},
};

/**
 * Concern 1.5: Popover(A) containing Popover(B). Tests FloatingTree isolation.
 * Uses raw Base UI Popover from both bundles since @wordpress/ui doesn't have Popover yet.
 */
export const PopoverInPopover: Story = {
	name: '1.5 Popover(B1) + Popover(B2)',
	render: () => {
		const [ outerOpen, setOuterOpen ] = useState( false );
		const [ innerOpen, setInnerOpen ] = useState( false );
		return (
			<div>
				<p
					style={ {
						color: '#666',
						fontSize: '13px',
						margin: '0 0 12px',
					} }
				>
					Both Popovers use raw Base UI from Bundle B (simulating
					same-bundle but exercising the Popover component which WPDS
					doesn&apos;t wrap yet).
				</p>
				<div
					style={ {
						display: 'flex',
						gap: '8px',
						marginBottom: '12px',
					} }
				>
					<StatusBadge label="Outer" isOpen={ outerOpen } />
					<StatusBadge label="Inner" isOpen={ innerOpen } />
				</div>
				<BundleB.Popover.Root
					open={ outerOpen }
					onOpenChange={ setOuterOpen }
				>
					<BundleB.Popover.Trigger style={ { padding: '8px 16px' } }>
						Open Outer Popover
					</BundleB.Popover.Trigger>
					<BundleB.Popover.Portal>
						<BundleB.Popover.Positioner>
							<BundleB.Popover.Popup style={ popupStyle }>
								<h4 style={ { margin: '0 0 8px' } }>
									Outer Popover
								</h4>
								<BundleB.Popover.Root
									open={ innerOpen }
									onOpenChange={ setInnerOpen }
								>
									<BundleB.Popover.Trigger
										style={ { padding: '6px 12px' } }
									>
										Open Inner Popover
									</BundleB.Popover.Trigger>
									<BundleB.Popover.Portal>
										<BundleB.Popover.Positioner>
											<BundleB.Popover.Popup
												style={ {
													...popupStyle,
													background: '#f0f8ff',
												} }
											>
												<h4
													style={ {
														margin: '0 0 8px',
													} }
												>
													Inner Popover
												</h4>
												<p style={ { margin: 0 } }>
													Press Escape — does only
													this close?
												</p>
											</BundleB.Popover.Popup>
										</BundleB.Popover.Positioner>
									</BundleB.Popover.Portal>
								</BundleB.Popover.Root>
							</BundleB.Popover.Popup>
						</BundleB.Popover.Positioner>
					</BundleB.Popover.Portal>
				</BundleB.Popover.Root>
			</div>
		);
	},
};

function ThreeLevelVariant( {
	D,
	P,
	S,
	labels,
}: {
	D: typeof BundleA;
	P: typeof BundleA;
	S: typeof BundleA;
	labels: { d: string; p: string; s: string };
} ) {
	const [ dialogOpen, setDialogOpen ] = useState( false );
	const [ popoverOpen, setPopoverOpen ] = useState( false );
	return (
		<div>
			<div
				style={ {
					display: 'flex',
					gap: '8px',
					marginBottom: '12px',
				} }
			>
				<StatusBadge
					label={ `Dialog(${ labels.d })` }
					isOpen={ dialogOpen }
				/>
				<StatusBadge
					label={ `Popover(${ labels.p })` }
					isOpen={ popoverOpen }
				/>
			</div>
			<D.Dialog.Root open={ dialogOpen } onOpenChange={ setDialogOpen }>
				<D.Dialog.Trigger style={ { padding: '8px 16px' } }>
					Open Dialog ({ labels.d })
				</D.Dialog.Trigger>
				<D.Dialog.Portal>
					<D.Dialog.Backdrop
						style={ {
							position: 'fixed',
							inset: 0,
							background: 'rgba(0,0,0,0.3)',
						} }
					/>
					<D.Dialog.Popup
						style={ {
							...popupStyle,
							position: 'fixed',
							top: '50%',
							left: '50%',
							transform: 'translate(-50%, -50%)',
							minWidth: '400px',
						} }
					>
						<h4 style={ { margin: '0 0 12px' } }>
							Dialog ({ labels.d })
						</h4>
						<P.Popover.Root
							open={ popoverOpen }
							onOpenChange={ setPopoverOpen }
						>
							<P.Popover.Trigger
								style={ { padding: '6px 12px' } }
							>
								Open Popover ({ labels.p })
							</P.Popover.Trigger>
							<P.Popover.Portal>
								<P.Popover.Positioner>
									<P.Popover.Popup
										style={ {
											...popupStyle,
											background: '#f0f8ff',
										} }
									>
										<h4
											style={ {
												margin: '0 0 8px',
											} }
										>
											Popover ({ labels.p })
										</h4>
										<p>
											Select ({ labels.s }) below — should
											appear ON TOP of this Popover:
										</p>
										<S.Select.Root defaultValue="Apple">
											<S.Select.Trigger
												style={ selectTriggerStyle }
											/>
											<S.Select.Portal>
												<S.Select.Positioner>
													<S.Select.Popup
														style={
															selectPopupStyle
														}
													>
														<SelectItems
															lib={ S }
														/>
													</S.Select.Popup>
												</S.Select.Positioner>
											</S.Select.Portal>
										</S.Select.Root>
									</P.Popover.Popup>
								</P.Popover.Positioner>
							</P.Popover.Portal>
						</P.Popover.Root>
					</D.Dialog.Popup>
				</D.Dialog.Portal>
			</D.Dialog.Root>
		</div>
	);
}

/**
 * Three-level nesting — same bundle (baseline). All components from Bundle A.
 * PortalContext is shared, so the Select portal nests inside the Popover portal.
 * Visual stacking is correct.
 */
export const ThreeLevelSameBundle: Story = {
	name: '1.6a Three-level (same bundle — baseline)',
	render: () => (
		<ThreeLevelVariant
			D={ BundleA }
			P={ BundleA }
			S={ BundleA }
			labels={ { d: 'A', p: 'A', s: 'A' } }
		/>
	),
};

/**
 * Three-level nesting — cross bundle with interleaved pattern: A→B→A.
 * The Select (A) reads PortalContext_A and finds the Dialog's portal (A),
 * skipping over the Popover's portal (B). The Select renders BEHIND the
 * Popover — this is the visual stacking regression.
 */
export const ThreeLevelCrossBundle: Story = {
	name: '1.6b Three-level (cross bundle A→B→A — REGRESSION)',
	render: () => (
		<ThreeLevelVariant
			D={ BundleA }
			P={ BundleB }
			S={ BundleA }
			labels={ { d: 'A', p: 'B', s: 'A' } }
		/>
	),
};

/**
 * Concern 5.1: WPDS Select inside legacy @wordpress/components Modal.
 */
export const LegacyModalWithWPDSSelect: Story = {
	name: '5.1 Legacy Modal + WPDS Select',
	render: () => {
		const [ modalOpen, setModalOpen ] = useState( false );
		return (
			<div>
				<div
					style={ {
						display: 'flex',
						gap: '8px',
						marginBottom: '12px',
					} }
				>
					<StatusBadge label="Legacy Modal" isOpen={ modalOpen } />
				</div>
				<button onClick={ () => setModalOpen( true ) }>
					Open Legacy Modal
				</button>
				{ modalOpen && (
					<Modal
						title="Legacy @wordpress/components Modal"
						onRequestClose={ () => setModalOpen( false ) }
					>
						<p>
							WPDS Select below — clicking it should NOT close
							this Modal:
						</p>
						<WPSelect.Root defaultValue="Apple">
							<WPSelect.Trigger />
							<WPSelect.Popup>
								{ [
									'Apple',
									'Banana',
									'Cherry',
									'Date',
									'Elderberry',
								].map( ( fruit ) => (
									<WPSelect.Item
										key={ fruit }
										value={ fruit }
									/>
								) ) }
							</WPSelect.Popup>
						</WPSelect.Root>
					</Modal>
				) }
			</div>
		);
	},
};

/**
 * Concern 5.2: Legacy Popover inside WPDS Dialog.
 */
export const WPDSDialogWithLegacyPopover: Story = {
	name: '5.2 WPDS Dialog + Legacy Popover',
	render: () => {
		const [ dialogOpen, setDialogOpen ] = useState( false );
		const [ popoverAnchor, setPopoverAnchor ] =
			useState< HTMLButtonElement | null >( null );
		const [ showPopover, setShowPopover ] = useState( false );
		return (
			<div>
				<div
					style={ {
						display: 'flex',
						gap: '8px',
						marginBottom: '12px',
					} }
				>
					<StatusBadge label="WPDS Dialog" isOpen={ dialogOpen } />
					<StatusBadge
						label="Legacy Popover"
						isOpen={ showPopover }
					/>
				</div>
				<WPDialog.Root
					open={ dialogOpen }
					onOpenChange={ setDialogOpen }
				>
					<WPDialog.Trigger>Open WPDS Dialog</WPDialog.Trigger>
					<WPDialog.Popup>
						<WPDialog.Header>
							<WPDialog.Title>WPDS Dialog</WPDialog.Title>
						</WPDialog.Header>
						<p>
							Click below to open a legacy @wordpress/components
							Popover:
						</p>
						<button
							ref={ setPopoverAnchor }
							onClick={ () => setShowPopover( ! showPopover ) }
						>
							Toggle Legacy Popover
						</button>
						{ showPopover && (
							<LegacyPopover
								anchor={ popoverAnchor }
								onClose={ () => setShowPopover( false ) }
							>
								<div style={ { padding: '16px' } }>
									<p style={ { margin: 0 } }>
										Legacy Popover content.
										<br />
										Clicking here should NOT close the WPDS
										Dialog.
									</p>
								</div>
							</LegacyPopover>
						) }
					</WPDialog.Popup>
				</WPDialog.Root>
			</div>
		);
	},
};
