let mockActiveCollaborators: any[] = [];
let mockLastPostSave: { savedAt: number; savedByClientId: number } | null =
	null;
		useActiveCollaborators: jest.fn( () => mockActiveCollaborators ),
			( _postId: unknown, _postType: unknown, callback: Function ) => {
			( _postId: unknown, _postType: unknown, callback: Function ) => {
			( _postId: unknown, _postType: unknown, callback: Function ) => {
	return () => ( {
		getCurrentPostAttribute: ( attr: string ) =>
			attr === 'status' ? mockEditorState.postStatus : undefined,
		isCollaborationEnabledForCurrentPost: () =>
			mockEditorState.isCollaborationEnabled,
	} );
	mockActiveCollaborators = [];
	mockLastPostSave = null;
			mockActiveCollaborators = [ me ];
			mockActiveCollaborators = [ me, bobJoinedAfter ];
			rerender();
	describe( 'collaborator leave notifications', () => {
		it( 'fires a leave notification when a collaborator disconnects (isConnected → false)', () => {
			const alice = makeCollaborator();
			mockActiveCollaborators = [ makeMe(), alice ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			);
			// Alice disconnects — still in the list but greyed out.
			expect( mockCreateNotice ).toHaveBeenCalledWith(
				'info',
		it( 'fires a leave notification when a connected collaborator is removed from the list directly', () => {
			mockActiveCollaborators = [ makeMe(), alice ];
			// Alice disappears from the list without going through isConnected=false
			// (e.g. polling detects the disconnect and removes in one update).
			mockActiveCollaborators = [ makeMe(), alice ];
			// State map reports Alice saved
			mockLastPostSave = {
				savedAt: Date.now(),
				savedByClientId: alice.clientId,
			};
			rerender();
			mockActiveCollaborators = [ makeMe(), alice ];
			mockLastPostSave = {
				savedAt: Date.now(),
				savedByClientId: alice.clientId,
			};
			rerender();
		it( 'does not fire a notification when the current user saves', () => {
			const me = makeMe();
			mockActiveCollaborators = [ me, makeCollaborator() ];
			const { rerender } = renderHook( () =>
			mockActiveCollaborators = [ makeMe(), alice ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			// First save event
			mockLastPostSave = {
				savedAt,
				savedByClientId: alice.clientId,
			};
			rerender();
			mockCreateNotice.mockClear();
		it( 'does not fire a notification when a peer reconnects without a new save', () => {
			mockActiveCollaborators = [ makeMe(), alice ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			// Alice disconnects and reconnects — useLastPostSave filters
			// pre-existing state map values via its baseline check, so
			// lastPostSave stays null.
			mockActiveCollaborators = [
				makeMe(),
				{ ...alice, isConnected: false },
		it( 'does not fire a notification when the saver is not in the collaborator list', () => {
			mockActiveCollaborators = [ makeMe(), makeCollaborator() ];
			const { rerender } = renderHook( () =>
				useCollaboratorNotifications( 123, 'post' )
			rerender();
