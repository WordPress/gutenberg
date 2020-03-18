## Master

## 1.5.0 (2020-02-04)

### Bug Fixes

- Resolves an issue where `flush` would not invoke the callback associated with the given element. The previous implementation would simply remove the element from the queue. The updated behavior adheres to what one would expect from a flush as in to complete the deferred execution immediately. With these changes, all callbacks will always (eventually) be invoked unless the application is abruptly terminated. A future version could introduce support for a `remove` function to replicate the previous behavior of `flush`.

## 1.0.0 (2019-03-06)

Initial release.
