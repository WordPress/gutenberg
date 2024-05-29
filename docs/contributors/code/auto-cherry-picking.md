# Cherry-picking automation

`npm run other:cherry-pick` automates cherry-picking Pull Requests with a specific label into the **current branch**.

It's especially useful for major WordPress releases as by default the script looks for merged Pull Requests with the `Backport to WP Beta/RC` label.

You can also use it in different scenarios by passing a custom label as the first argument. See the Gutenberg plugin release example at the end of this document.

Running `npm run other:cherry-pick` yields the following prompt:

```
You are on branch "wp/6.2".
This script will:
• Cherry-pick the merged PRs labeled as "Backport to WP Beta/RC" to this branch
• Ask whether you want to push this branch
• Comment on each PR
• Remove the label from each PR

The last two actions will be performed USING YOUR GITHUB ACCOUNT that you've
linked to your GitHub CLI (gh command)

Do you want to proceed? (Y/n)
```

Here's what happens once you agree:

```
Trying to cherry-pick one by one..

$ git pull origin wp/6.2 --rebase...
$ git fetch origin trunk...

Found the following PRs to cherry-pick:
   #41198 – Site Editor: Set min-width for styles preview

Fetching commit IDs... Done!
   #41198 – 860a39665c318d33027d – Site Editor: Set min-width for...

Trying to cherry-pick one by one...

Cherry-picking round 1:
    cherry-pick commit: afe9b757b4  for PR: #41198 – Site Editor: Set min-width for...
Cherry-picking finished!

Summary:
    1 PRs got cherry-picked cleanly
    0 PRs failed

About to push to origin/wp/6.2
Do you want to proceed? (Y/n)
```

This run was successful, yay! You can use this moment to confirm the correct PRs were cherry-picked.

What if the cherry-picks didn't apply cleanly? The script would apply the rest and retry.
If some cherry-picks still failed, the script would skip them and let you know which conflicts require a manual resolution.

Either way, here's what happens once you proceed past the cherry-picking stage:

```
Pushing to origin/wp/6.2
Commenting and removing labels...
  41198: I just cherry-picked this PR to the wp/6.2 branch to get it included in the next release: afe9b757b4
Done!
```

The commenting part is optional and only possible if you have the [`gh` console utility](https://cli.github.com/) installed.

### Can I use a different label than `Backport to WP Beta/RC`?

Yes! Pass it as the first argument:

```
npm run other:cherry-pick "Another Label"
```

### How can I use it for a Gutenberg plugin release?

```
# Switch to the release branch
git checkout release/X.Y

# Cherry-pick all the merged PRs with a relevant backport label
npm run other:cherry-pick "Backport to Gutenberg RC"
```

### Future improvements

In the future, it would be great if the script automatically selected the
relevant label based on the currently selected branch:

* release/X.Y - plugin release – "Backport to Gutenberg RC"
* wp/X.Y - WP release – "Backport to WP Beta/RC"
