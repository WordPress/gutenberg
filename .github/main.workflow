workflow "Milestone merged pull requests" {
  on = "pull_request"
  resolves = ["Milestone It"]
}

action "Milestone It" {
  uses = "./.github/actions/milestone-it"
  secrets = ["GITHUB_TOKEN"]
}
