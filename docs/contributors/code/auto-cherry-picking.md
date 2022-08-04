# Cherry-picking automation

The cherry-picking automation makes cherry-picking PRs into WordPress and Gutenberg release branches a breeze.

It works as follows: you switch to the relevant release branch and run  `npm run cherry-pick`.

It gives you the following prompt:

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
   ✅  cherry-pick commit: afe9b757b4  for PR: #41198 – Site Editor: Set min-width for...
Cherry-picking finished!

Summary:
   ✅  1 PRs got cherry-picked cleanly
   ✅  0 PRs failed

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
✅ 41198: I just cherry-picked this PR to the wp/6.2 branch to get it included in the next release: afe9b757b4
Done!
```

The commenting part is optional and only possible if you have the [`gh` console utility](https://cli.github.com/) installed.

### Can I use a different label than `Backport to WP Beta/RC`?

Yes! Pass it as the first argument:

```
npm run cherry-pick "Another Label"
```
