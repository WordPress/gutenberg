FROM debian:stable-slim

LABEL "name"="First Time Contributor"
LABEL "maintainer"="The WordPress Contributors"
LABEL "version"="1.0.0"

LABEL "com.github.actions.name"="First Time Contributor"
LABEL "com.github.actions.description"="Assigns the first time contributor label to pull requests"
LABEL "com.github.actions.icon"="award"
LABEL "com.github.actions.color"="green"

RUN apt-get update && \
	apt-get install --no-install-recommends -y jq curl ca-certificates && \
	apt-get clean -y

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
