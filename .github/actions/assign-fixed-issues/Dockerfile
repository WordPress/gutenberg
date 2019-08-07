FROM debian:stable-slim

LABEL "name"="Assign Fixed Issues"
LABEL "maintainer"="The WordPress Contributors"
LABEL "version"="1.0.0"

LABEL "com.github.actions.name"="Assign Fixed Issues"
LABEL "com.github.actions.description"="Assigns the issues fixed by a pull request to the author of that pull request"
LABEL "com.github.actions.icon"="flag"
LABEL "com.github.actions.color"="green"

RUN apt-get update && \
	apt-get install --no-install-recommends -y jq curl ca-certificates && \
	apt-get clean -y

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
