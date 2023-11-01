# Store locks

Operations mutating the store (resolvers, saveEntityRecord) interfere with each other by changing the state used by other "concurrent" operations. The solution is to enable these operations to lock parts of the state tree that are expected to remain constant for the duration of the operation. For example `saveEntityRecord("postType", "book", 3)` would acquire a lock on a book with id=3 and nothing else.

More generally, interfering store operations should run sequentially. Each operation acquires a lock scoped to its state dependencies. If a lock cannot be acquired, the operation is delayed until a lock can be acquired. Locks are either exclusive or shared. If all operations request a shared lock, everything is executed concurrently. If any operation requests an exclusive lock, is it run only after all other locks (shared or exclusive) acting on the same scope are released.

The most complex part of this API is the concept of lock scope. Locks are stored in a tree. Each node in the tree looks like this:

```jsx
{
	"locks": [],
	"children": {}
}
```

Locks are stored like this:

```jsx
{
	"locks": [ { "exclusive": false, /* data */ } ],
	"children": {}
}
```

A more complete, but still simplified, tree looks like this:

```jsx
{
	"locks": [],
	"children": {
		"book": {
			"locks": [],
			"children": {
				1: {
					"locks": [],
					"children": {}
				},
				2: {
					"locks": [],
					"children": {}
				}
			}
		}
	}
}
```

Let's imagine we want to fetch a list of books. One way to control concurrency would be to acquire a shared lock on `book`. The lock will be granted once there are **no exclusive locks** on:

-   `book` itself
-   All its parents (`root`)
-   All its descendants (`book > 1`, `book > 2`)

In the case above we're good to grab the lock, let's do it then:

```jsx
{
	"locks": [],
	"children": {
		"book": {
			"locks": [ { "exclusive": false, /* data */ } ],
			"children": {
				1: {
					"locks": [],
					"children": {}
				},
				2: {
					"locks": [],
					"children": {}
				}
			}
		}
	}
}
```

Let's imagine that another fetch was triggered to get a filtered list of entities. By checking the criteria above, it's okay to grab a shared lock on books so now we have two:

```jsx
/* ... */
		"book": {
			"locks": [ { "exclusive": false, /* data */ },  { "exclusive": false, /* data */ } ],
		}
/* ... */
```

While these are running, the user triggered an update of book id=1. Now an update operation requests an exclusive lock. It will be able to acquire one once there are **no locks at all** on:

-   `book > 1` itself
-   All its parents (`root`, `book`)
-   All its descendants (an empty list in this case)

Since there are two shared locks on `book`, the operation is delayed until both of them are released. Once that happens, an exclusive lock is granted on a specific book:

```jsx
/* ... */
		"book": {
			"locks": [],
			"children": {
				1: {
					"locks": [  { "exclusive": true,  /* data */ } ],
					"children": {}
				},
			},
		},
/* ... */
```

If any fetch operation is triggered now, it will attempt to acquire a shared lock on `book`. Since one of `book` descendants holds an exclusive lock, fetch must wait until that lock is released.

This structure makes it quite easy to control concurrent reads/writes with any granularity. For example, if we wanted to make sure two fetch operations may run only if their `query` is different, each could acquire two locks: a shared lock on `book` to prevent clashing with writes, and an exclusive lock on an unrelated branch such as `fetchByQuery > [query]`.
