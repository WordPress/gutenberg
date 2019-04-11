# **core/notices**: Notices Data

## Selectors

### getNotices

Returns all notices as an array, optionally for a given context. Defaults to
the global context.

*Parameters*

 * state: Notices state.
 * context: Optional grouping context.

## Actions

### createNotice

Yields action objects used in signalling that a notice is to be created.

*Parameters*

 * status: Notice status.
                                                      Defaults to `info`.
 * content: Notice message.
 * options: Notice options.
 * options.context: Context under which to
                                                      group notice.
 * options.id: Identifier for notice.
                                                      Automatically assigned
                                                      if not specified.
 * options.isDismissible: Whether the notice can
                                                      be dismissed by user.
                                                      Defaults to `true`.
 * options.speak: Whether the notice
                                                      content should be
                                                      announced to screen
                                                      readers. Defaults to
                                                      `true`.
 * options.actions: User actions to be
                                                      presented with notice.

### createSuccessNotice

Returns an action object used in signalling that a success notice is to be
created. Refer to `createNotice` for options documentation.

*Parameters*

 * content: Notice message.
 * options: Optional notice options.

### createInfoNotice

Returns an action object used in signalling that an info notice is to be
created. Refer to `createNotice` for options documentation.

*Parameters*

 * content: Notice message.
 * options: Optional notice options.

### createErrorNotice

Returns an action object used in signalling that an error notice is to be
created. Refer to `createNotice` for options documentation.

*Parameters*

 * content: Notice message.
 * options: Optional notice options.

### createWarningNotice

Returns an action object used in signalling that a warning notice is to be
created. Refer to `createNotice` for options documentation.

*Parameters*

 * content: Notice message.
 * options: Optional notice options.

### removeNotice

Returns an action object used in signalling that a notice is to be removed.

*Parameters*

 * id: Notice unique identifier.
 * context: Optional context (grouping) in which the notice is
                         intended to appear. Defaults to default context.