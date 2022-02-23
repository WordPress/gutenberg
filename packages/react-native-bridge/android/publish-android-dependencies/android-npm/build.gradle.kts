plugins {
    id("com.github.node-gradle.node") version "3.2.1"
}

val gutenbergPackageJson = File("$projectDir/../../../../../")

node {
    download.set(true)
    version.set("14.18.3")
    nodeProjectDir.set(gutenbergPackageJson)

}

